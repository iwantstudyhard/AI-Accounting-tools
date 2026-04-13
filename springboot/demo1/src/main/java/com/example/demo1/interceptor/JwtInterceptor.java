package com.example.demo1.interceptor;

import com.example.demo1.utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

@Component
public class JwtInterceptor implements HandlerInterceptor {
    @Autowired
    private JwtUtils jwtUtils;
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        // 1. 如果是跨域的预检请求 (OPTIONS)，直接放行
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }
        // 2. 按照行业标准，从请求头 "Authorization" 中获取 Token
        String authHeader = request.getHeader("Authorization");
        // 3. 校验请求头格式（标准格式为 "Bearer 你的Token"）
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // 如果没带 Token，或者格式不对，直接拦截并报错
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\": \"未登录或缺乏访问权限 (Token缺失)\"}");
            return false; // false 代表拦截，不让请求进入 Controller
        }
        // 4. 提取真正的 Token 字符串 (截取 "Bearer " 后面的部分)
        String token = authHeader.substring(7);
        try {
            // 5. 呼叫工具类验证 Token！(如果过期或被篡改，这里会直接抛出异常)
            Long userId = jwtUtils.verifyTokenAndGetUserId(token);

            // 6. 【精髓一步】：把解密出来的真实 userId 塞进当前的 Request 请求里
            // 这样等会儿请求流转到 Controller 时，Controller 就可以直接白嫖这个 userId 了！
            request.setAttribute("userId", userId);
            return true; // 验明正身，放行！
        } catch (Exception e) {
            // Token 验证失败（过期、伪造等）
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\": \"Token 已过期或不合法，请重新登录\"}");
            return false; // 拦截！
        }
    }
}
