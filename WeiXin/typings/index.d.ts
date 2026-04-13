/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    backgroundType: 'color' | 'image',
    backgroundColor: string,
    backgroundImage: string
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
  updateBackground?: (type: 'color' | 'image', value: string) => void
}