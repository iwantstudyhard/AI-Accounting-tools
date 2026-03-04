import * as echarts from './echarts';

Component({
  properties: {
    ec: {
      type: Object,
      value: {}
    }
  },

  data: {},

  lifetimes: {
    ready() {
      if (!this.data.ec) {
        console.warn('WARN: ec prop is required');
        return;
      }
      
      const query = wx.createSelectorQuery().in(this);
      query.select('#canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            console.error('Canvas node not found');
            return;
          }
          
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;
          
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          ctx.scale(dpr, dpr);

          const chart = echarts.init(canvas, null, {
            width: res[0].width,
            height: res[0].height
          });

          if (this.data.ec.onInit) {
            this.data.ec.onInit(chart, res[0].width, res[0].height);
          }
          
          this.chart = chart;
        });
    }
  },

  methods: {
    touchStart(e: any) {
      if (this.chart && this.chart.bind) {
        this.chart.bind('touchstart', e);
      }
    },
    touchMove(e: any) {
      if (this.chart && this.chart.bind) {
        this.chart.bind('touchmove', e);
      }
    },
    touchEnd(e: any) {
      if (this.chart && this.chart.bind) {
        this.chart.bind('touchend', e);
      }
    }
  }
});