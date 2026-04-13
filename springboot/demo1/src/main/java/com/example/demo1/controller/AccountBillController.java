package com.example.demo1.controller;


import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo1.entity.AccountBill;
import com.example.demo1.mapper.AccountBillMapper;
import com.example.demo1.service.OssService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/bill")
public class AccountBillController {

    @Autowired
    private AccountBillMapper accountBillMapper;
    @Autowired
    private OssService ossService;
    @GetMapping("/list")
    public List<AccountBill> getBillList(
            @RequestAttribute("userId") Long userId,  //直接从 token 中获取的userId，不用显式返回
            @RequestParam(value = "categoryName", required = false) String categoryName, // 可选：比如 "餐饮"
            @RequestParam(value = "startDate", required = false) String startDate, // 可选：比如 "2026-02-01"
            @RequestParam(value = "endDate", required = false) String endDate // 可选：比如 "2026-02-28"
    )
    {
        // 1. 创建 MyBatis-Plus 的查询包装器
        LambdaQueryWrapper<AccountBill> wrapper = new LambdaQueryWrapper<>();

        // 2. 必须加上用户 ID，防止数据串线
        wrapper.eq(AccountBill::getUserId, userId);

        // 3. 动态拼装条件：如果前端传了种类，就加上种类过滤
        if (categoryName != null && !categoryName.isEmpty()) {
            wrapper.eq(AccountBill::getCategoryName, categoryName);
        }

        // 4. 动态拼装条件：如果前端传了时间范围，就加上时间过滤
        if (startDate != null && endDate != null) {
            wrapper.between(AccountBill::getRecordDate, startDate, endDate);
        }

        // 5. 排序：按交易日期倒序（最新的账单排在最上面），日期相同按创建时间倒序
        wrapper.orderByDesc(AccountBill::getRecordDate, AccountBill::getCreateTime);

        // 6. 执行查询并返回给前端！
        System.out.println("查询成功");
        return accountBillMapper.selectList(wrapper);
    }




    //利用手动添加记账信息
    @PostMapping("/add")
    public  String addBill( AccountBill bill,
                            @RequestAttribute("userId") Long userId,
                            @RequestParam(value = "file",required = false) MultipartFile file
                            )
    {

        bill.setUserId(userId);
        // 1. 基础的数据校验（防止前端传过来空数据导致数据库报错）
        if (bill.getAmount() == null) {
            return "{\"error\": \"金额不能为空\"}";
        }
        if (bill.getCategoryName() == null || bill.getCategoryName().isEmpty()) {
            return "{\"error\": \"分类不能为空\"}";
        }
        if (bill.getRecordDate() == null) {
            return "{\"error\": \"日期不能为空\"}";
        }
        //因为照片是可选的，因此要判断一下
        if(file != null&&!file.isEmpty()) {
            System.out.println("开始上传照片到 oss");
            // 1. 调用 Service 层，把文件扔给阿里云 OSS
            String imageUrl = ossService.uploadFile(file);
            // 2. 返回结果：如果成功，你会拿到一个以 https:// 开头的图片链接
            if (imageUrl == null) {
                return "照片上传出错";
            }
            System.out.println("上传成功！图片访问地址：" + imageUrl);
            bill.setReceiptImageUrl(imageUrl);
        }
        try {
            // 如果前端没传收支类型，默认当做支出(1)
            if (bill.getType() == null) {
                bill.setType(1);
            }
            // 3. 一键存入数据库 (MyBatis-Plus 魔法)
            accountBillMapper.insert(bill);
            // 4. 返回成功信息
            return "{\"success\": true, \"message\": \"记账成功\", \"id\": " + bill.getId() + "}";
        } catch (Exception e) {
            e.printStackTrace();
            return "{\"error\": \"服务器内部错误: " + e.getMessage() + "\"}";
        }
    }
}
