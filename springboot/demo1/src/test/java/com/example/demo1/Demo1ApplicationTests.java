package com.example.demo1;

import com.example.demo1.entity.AccountBill;
import com.example.demo1.mapper.AccountBillMapper;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.time.LocalDate;

@SpringBootTest
@MapperScan("com.example.demo1.mapper")
class Demo1ApplicationTests {

    // 1. 自动注入我们之前写好的 Mapper 接口
    @Autowired
    private AccountBillMapper accountBillMapper;

    @Test
    void testInsertBill() {
        // 2. 实例化一个账单对象，并塞入模拟数据
        AccountBill bill = new AccountBill();
        bill.setUserId(1001L); // 模拟一个用户ID
        bill.setAmount(new BigDecimal("9.9")); // 模拟金额
        bill.setType(1); // 1 代表支出
        bill.setCategoryName("技术服务");
        bill.setMerchantName("阿里云"); // 模拟 AI 自动识别出的商户名
        bill.setRecordDate(LocalDate.now()); // 记录为今天的日期
        bill.setRemark("测试 MyBatis-Plus 数据库连接是否成功");

        // 3. 调用 Mapper 的 insert 方法将对象存入数据库
        int result = accountBillMapper.insert(bill);

        // 4. 打印执行结果
        System.out.println("====================================");
        System.out.println("插入成功！影响了 " + result + " 行数据。");
        System.out.println("MyBatis-Plus 自动生成的主键 ID 是: " + bill.getId());
        System.out.println("====================================");
    }

}
