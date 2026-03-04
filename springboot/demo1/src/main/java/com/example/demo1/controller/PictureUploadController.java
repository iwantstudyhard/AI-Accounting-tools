package com.example.demo1.controller;


import com.alibaba.fastjson2.JSON;
import com.example.demo1.entity.AccountBill;
import com.example.demo1.mapper.AccountBillMapper;
import com.example.demo1.service.AccountingSercice;
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
     * 图片上传接口
     * 请求方式：POST
     * 请求地址：http://localhost:8080/api/picture/upload
     */

    @Autowired
    private OssService ossService;
    @Autowired
    private AccountingSercice accountingSercice;
    @Autowired
    private AccountBillMapper accountBillMapper;
    @PostMapping("/upload")
    public String upload(@RequestParam("file") MultipartFile file) {
        // 1. 基础判断：防止上传空文件
        System.out.println("开始上传照片到 oss");
        if (file.isEmpty()) {
            return "文件为空，请选择一张图片上传";
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
            AccountBill bill = JSON.parseObject(aiResultJson, AccountBill.class);//把返回结果放到 accountbill，然后调用 mapper ，存到数据库
            bill.setReceiptImageUrl(imageUrl);
            bill.setUserId(1001l);//后续替换成微信小程序的 userId
            accountBillMapper.insert(bill);
            System.out.println("成功插入到数据库！账单 ID："+bill.getId());
            return JSON.toJSONString(bill);
        }
        return "服务器内部出错";
    }
}
