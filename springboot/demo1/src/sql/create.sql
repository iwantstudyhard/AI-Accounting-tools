CREATE TABLE `account_bill` (
                                `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
                                `user_id` BIGINT NOT NULL COMMENT '所属用户ID',
                                `amount` DECIMAL(10, 2) NOT NULL COMMENT '交易金额',
                                `type` TINYINT NOT NULL COMMENT '收支类型：1-支出，2-收入',
                                `category_name` VARCHAR(50) NOT NULL COMMENT '账单分类（如餐饮、交通）',
                                `merchant_name` VARCHAR(100) DEFAULT NULL COMMENT '商户名称（AI提取）',
                                `record_date` DATE NOT NULL COMMENT '交易日期',
                                `receipt_image_url` VARCHAR(255) DEFAULT NULL COMMENT '阿里云OSS凭证图片链接',
                                `remark` VARCHAR(255) DEFAULT NULL COMMENT '用户备注',
                                `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                PRIMARY KEY (`id`),
                                INDEX `idx_user_date` (`user_id`, `record_date`) -- 添加索引，方便后续按月统计生成图表
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账单明细表';