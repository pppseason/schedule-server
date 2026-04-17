const { request } = require('../../utils/request');

Page({
  data: {
    year: 0,
    month: 0,
    monthStr: '',
    days: [],
    hasScheduleDays: []
  },

  onLoad() {
    const now = new Date();
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1
    });
    this.renderCalendar();
    this.loadMonthSchedule();
  },

  onShow() {
    this.loadMonthSchedule();
  },

  renderCalendar() {
    const { year, month } = this.data;
    const monthStr = `${year}年${String(month).padStart(2, '0')}月`;
    
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay(); // 0=周日

    const days = [];
    // 前补空白
    for (let i = 0; i < startWeekday; i++) {
      days.push({ type: 'empty' });
    }
    // 当月日期
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        type: 'day',
        day: d,
        date: dateStr,
        isToday: this.isToday(dateStr)
      });
    }

    this.setData({ monthStr, days });
  },

  isToday(dateStr) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return dateStr === `${y}-${m}-${d}`;
  },

  loadMonthSchedule() {
    const monthQuery = `${this.data.year}-${String(this.data.month).padStart(2, '0')}`;
    request({
      url: '/schedule/calendar?month=' + monthQuery,
      method: 'GET'
    }).then((res) => {
      const hasScheduleDays = res.data || [];
      const days = this.data.days.map(item => {
        if (item.type === 'day') {
          return { ...item, hasSchedule: hasScheduleDays.includes(item.date) };
        }
        return item;
      });
      this.setData({ hasScheduleDays, days });
    });
  },

  onPrevMonth() {
    let { year, month } = this.data;
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
    this.setData({ year, month }, () => {
      this.renderCalendar();
      this.loadMonthSchedule();
    });
  },

  onNextMonth() {
    let { year, month } = this.data;
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
    this.setData({ year, month }, () => {
      this.renderCalendar();
      this.loadMonthSchedule();
    });
  },

  onSelectDay(e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;
    wx.switchTab({
      url: '/pages/index/index'
    });
    // 通过全局方式传参（switchTab 不支持 query）
    getApp().globalData.selectedDate = date;
  }
});
