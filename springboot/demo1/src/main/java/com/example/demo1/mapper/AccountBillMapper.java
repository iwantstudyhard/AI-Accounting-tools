package com.example.demo1.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo1.entity.AccountBill;
import org.apache.ibatis.annotations.Mapper;
/**
 * 账单数据访问层
 */
@Mapper
public interface AccountBillMapper extends BaseMapper<AccountBill> {
    // 继承了 BaseMapper 后，你已经可以直接使用 insert(), deleteById(), selectList() 等方法了。
    // 如果后续为了小程序图表需要写复杂的统计 SQL（比如按月分组求和），可以写在这里。
}