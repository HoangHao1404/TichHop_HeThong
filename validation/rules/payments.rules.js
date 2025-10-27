import { regexRules, logicRules } from "./base.rules.js";
export const paymentRules = {
    PaymentID: [
        (v) => regexRules.paymentID.test(v),
        logicRules.notNull
    ],
    OrderID: [
        (v)=> regexRules.orderID.test(v), //todo: Có nghĩa là kiểm tra rule của oder có đúng hay không? nếu đúng trả về true, sai thì trả về false
        logicRules.notNull
    ],
    PaymentMethod: [
        logicRules.notNull,
        (v)=> logicRules.minLength(v, 2),
        (v)=> regexRules.name.test(v)
    ],
    Amount: [
        logicRules.isNumber,
        logicRules.isPositive,
    ],
    PaymentDate: [
        (v)=>regexRules.date.test(v),
        logicRules.validDate,
        logicRules.notFutureDate
    ]
};