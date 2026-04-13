CREATE TABLE `user` (
                        `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '内部用户主键ID',
                        `openid` varchar(64) NOT NULL COMMENT '微信OpenID(唯一身份标识)',
                        `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '首次注册时间',
                        `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后登录/更新时间',
                        PRIMARY KEY (`id`),
                        UNIQUE KEY `uk_openid` (`openid`) -- 建立唯一索引，防止同一个人插入两条记录，同时也大大加快查询速度
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信用户表';