package com.example.demo1;

import com.example.demo1.entity.AccountBill;
import com.example.demo1.mapper.AccountBillMapper;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.time.LocalDate;

@SpringBootTest
@MapperScan("com.example.demo1.mapper")
class Demo1ApplicationTests {

    public static void main(String[] args) {
        SpringApplication.run(Demo1Application.class, args);
    }

}


