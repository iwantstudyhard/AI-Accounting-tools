package com.example.demo1.controller;


import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo1.entity.AccountBill;
import com.example.demo1.mapper.AccountBillMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bill")
public class AccountBillController {

    @Autowired
    private AccountBillMapper accountBillMapper;

    @GetMapping("/list")
    public List<AccountBill> getBillList(
            @RequestParam("userId") Long userId, // 必须有：查哪个用户的？
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
        return accountBillMapper.selectList(wrapper);
    }
}
