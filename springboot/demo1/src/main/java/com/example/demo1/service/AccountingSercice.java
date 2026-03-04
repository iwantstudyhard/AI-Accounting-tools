package com.example.demo1.service;


import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversation;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversationParam;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversationResult;
import com.alibaba.dashscope.common.MultiModalMessage;
import com.alibaba.dashscope.common.Role;
import com.alibaba.dashscope.utils.Constants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


import java.util.Arrays;
import java.util.Collections;

@Service
public class AccountingSercice {

    @Value("${aliyun.dashscope.api-key}")
    private String apiKey;

    private static final String PROMPT = "你是一个专业的智能财务记账助手，拥有强大的图像文字提取和消费场景推理能力。\n" +
            "请仔细分析我提供的账单/发票/支付截图，提取关键消费信息，并严格按照下方的 JSON 格式返回结果。\n" +
            "【提取要求】\n" +
            "1. recordDate：消费日期，格式 YYYY-MM-DD\n" +
            "2. amount：消费总金额，纯数字\n" +
            "3. merchantName：商家名称\n" +
            "4. categoryName：从 [餐饮, 交通, 购物, 居住, 娱乐, 医疗, 教育, 通讯, 其他] 中选择一项\n" +
            "5. type：收支类型，支出为 1，收入为 2\n" +
            "6. remark：结合图片上的具体商品明细、商家和时间，用第一人称生成一句简短的场景回忆（例如：\"在星巴克买了两杯拿铁\" 或 \"晚上打车回家\"），不超过20个字。如果图片上没有具体商品明细，可结合商家名称简单生成。\n" +
            "【输出规范】\n" +
            "必须且只能返回纯合法的 JSON 字符串！绝不要使用 Markdown 代码块包裹（不要输出 ```json），不要有任何废话。";
    /**
     * 调用 Qwen-VL 识别图片
     * @param imageUrl 阿里云 OSS 的图片链接
     * @return 纯 JSON 字符串
     */
    public String analyzeReceipt(String imageUrl){
        Constants.apiKey = apiKey;
        System.out.println("========== 正在使用的 API-KEY 是: " + apiKey + " ==========");
        String fastImageUrl = imageUrl + "?x-oss-process=image/resize,w_1024/quality,q_80";
        try {
            MultiModalMessage message = MultiModalMessage.builder()
                    .role(Role.USER.getValue())
                    .content(Arrays.asList(
                            Collections.singletonMap("image",fastImageUrl),
                            Collections.singletonMap("text",PROMPT)
                    ))
                    .build();

            MultiModalConversationParam param =MultiModalConversationParam.builder()
                    .model("qwen3.5-plus")
                    .message(message)
                    .topP(0.1) // 让它只选概率最高的词，别去发散思考
                    .topK(1)   // 限制候选词数量
                    .build();

            MultiModalConversation conv =new MultiModalConversation();
            MultiModalConversationResult result=conv.call(param);

            // 5. 剥洋葱一样，把最深处的文本提取出来
            String aiResponse = result.getOutput().getChoices().get(0).getMessage().getContent().get(0).get("text").toString();
            System.out.println(aiResponse);
            return aiResponse;
        }catch (Exception e) {
            e.printStackTrace();
            System.out.println("AI识别发生异常" + e.getMessage());
            return null;
        }
    }
}
