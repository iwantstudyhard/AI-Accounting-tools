package com.example.demo1.controller;


import cn.hutool.http.HttpUtil;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo1.entity.User;
import com.example.demo1.mapper.UserMapper;
import com.example.demo1.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/user")
public class UserController {
    @Value("${wechat.miniapp.appid}")
    private String appid;
    @Value("${wechat.miniapp.secret}")
    private String secret;
    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserMapper userMapper;
    @PostMapping("/wxLogin")
    public String wxLogin(@RequestBody String body) {
        JSONObject object = JSONObject.parseObject(body);
        String code = object.getString("code");
        if(code==null || code.isEmpty()){
            return "{\\\"error\\\": \\\"code不能为空\\}";
        }
        //用 code 去微信总部请求 openid
        String url = String.format(
                "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                appid, secret, code);

        // 发起 HTTP GET 请求
        String wxResponse = HttpUtil.get(url);
        JSONObject wxJson = JSON.parseObject(wxResponse);

        // 3. 解析微信返回的结果
        String openid = wxJson.getString("openid");
        if (openid == null) {
            return "{\"error\": \"微信登录失败: " + wxJson.getString("errmsg") + "\"}";
        }

        System.out.println("成功获取到用户的 OpenID: " + openid);

        //拿着 openId 去数据库查询是否已经存在，选择新插入还是查询信息，返回 token 给前端。
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<User>();
        queryWrapper.eq(User::getOpenid, openid);
        User user = userMapper.selectOne(queryWrapper);
        Long realUserId;

        if (user == null) {
            //找不到对应的数据，因为 openid 并不存在
            User newUser = new User();
            newUser.setOpenid(openid);
            userMapper.insert(newUser);//插入数据库
            realUserId = newUser.getId();
            System.out.println("新用户注册成功！内部 id 为"+realUserId);
        }else{
            realUserId = user.getId();
            System.out.println("老用户回归，内部 id 为"+realUserId);
        }
        // 5. 颁发我们自己系统的 Token
        String token = jwtUtils.generateToken(realUserId);

        // 6. 将 Token 返回给前端小程序
        return "{\"success\": true, \"token\": \"" + token + "\"}";
    }

    @GetMapping("/mockLogin")
    public String mockLogin() {
        String token = jwtUtils.generateToken(1L);
        return "{\"success\": true, \"token\": \"" + token + "\"}";
    }
}
