package com.example.demo1.config;

import com.example.demo1.interceptor.JwtInterceptor;
import com.example.demo1.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig  implements WebMvcConfigurer {

    @Autowired
    private JwtInterceptor jwtInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry){
        // 把我们的保安注册进去
        registry.addInterceptor(jwtInterceptor)
                .addPathPatterns("/api/**") // 拦截所有以 /api/ 开头的请求
                .excludePathPatterns(
                        "/api/user/wxLogin",
                        "/api/user/mockLogin"
                ); // 【免检通道】：微信登录接口绝对不能拦截，否则死循环了
    }
    }
