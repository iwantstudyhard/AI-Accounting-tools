package com.example.demo1.controller;


import com.alibaba.fastjson2.JSON;
import com.example.demo1.entity.AccountBill;
import com.example.demo1.mapper.AccountBillMapper;
import com.example.demo1.service.AccountingSercice;
import com.example.demo1.utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.jackson.autoconfigure.JacksonProperties;
import org.springframework.stereotype.Controller;
import com.example.demo1.service.OssService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/picture")
public class PictureUploadController {
    /**
     * 请求 ai 的方法，将照片上传，ai 返回 json 结果
     * 请求方式：POST
     * 请求地址：http://localhost:8080/api/picture/upload
     */

    @Autowired
    private OssService ossService;
    @Autowired
    private AccountingSercice accountingSercice;
    @Autowired
    private AccountBillMapper accountBillMapper;
    @Autowired
    private JwtUtils jwtUtil;
    @PostMapping("/upload")
    public String upload(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        // 1. 基础判断：防止上传空文件
        System.out.println("开始上传照片到 oss");
        if (file.isEmpty()) {
            return "文件为空，请选择一张图片上传";
        }

        // 先拿 token
        String authHeader = request.getHeader("Authorization");
        String token = authHeader.substring(7);
        if (token == null || token.isEmpty()) {
            return "未登录，token 缺失";
        }
        // 2. 调用 Service 层，把文件扔给阿里云 OSS
        String imageUrl = ossService.uploadFile(file);
        // 3. 返回结果：如果成功，你会拿到一个以 https:// 开头的图片链接
        if (imageUrl == null) {
            return "照片上传出错";
        }
        System.out.println("上传成功！图片访问地址：" + imageUrl);
        System.out.println("开始让ai 识别照片返回数据");
        String  aiResultJson = accountingSercice.analyzeReceipt(imageUrl);//开始 ai 识别

        if(aiResultJson != null){
            Long userId = jwtUtil.verifyTokenAndGetUserId(token);
            AccountBill bill = JSON.parseObject(aiResultJson, AccountBill.class);//把返回结果放到 accountbill，然后调用 mapper ，存到数据库
            bill.setUserId(userId);
            bill.setReceiptImageUrl(imageUrl);
            accountBillMapper.insert(bill);
            System.out.println("成功插入到数据库！账单 ID："+bill.getId());
            return JSON.toJSONString(bill);
        }
        return "服务器内部出错";
    }
}
