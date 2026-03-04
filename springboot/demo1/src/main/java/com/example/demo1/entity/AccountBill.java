package com.example.demo1.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 账单实体类
 */
@Data // Lombok 注解，自动生成 getter/setter 和 toString
@TableName("account_bill") // 告诉 Spring Boot 这个类对应哪张表
public class AccountBill {

    @TableId(type = IdType.AUTO) // 主键自增
    private Long id;//主键 id

    private Long userId;//所属用户的 id

    private BigDecimal amount; // 涉及到钱，务必使用 BigDecimal 而不是 Double

    private Integer type;//收支类型：1-支出，2-收入

    private String categoryName;//账单分类

    private String merchantName;//商品名称

    private LocalDate recordDate;

    private String receiptImageUrl; // 这里存的就是阿里云 OSS 返回的 URL

    private String remark;//备注信息

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
