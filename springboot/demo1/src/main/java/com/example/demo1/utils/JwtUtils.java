package com.example.demo1.utils;


import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtils {
    @Value("${wechat.jwt.secret}")
    private String secret;

    @Value("${wechat.jwt.expiration}")
    private Long expiration;
    /**
     * 根据内部的用户 ID 生成 Token (颁发门禁卡)
     */
    public String generateToken(Long userId) {
        Algorithm algorithm = Algorithm.HMAC256(secret); // 使用你的专属密钥加密
        return JWT.create()
                .withClaim("userId", userId) // 把 userId 藏进 Token 里
                .withExpiresAt(new Date(System.currentTimeMillis() + expiration)) // 设置过期时间
                .sign(algorithm); // 盖章生效
    }

    /**
     * 校验 Token 并解析出 userId (验明正身)
     * 如果 Token 被篡改或已过期，这里会直接抛出异常
     */
    public Long verifyTokenAndGetUserId(String token) {
        Algorithm algorithm = Algorithm.HMAC256(secret);
        DecodedJWT jwt = JWT.require(algorithm)
                .build()
                .verify(token); // 核心校验动作
        return jwt.getClaim("userId").asLong(); // 把藏在里面的 userId 拿出来
    }
}
