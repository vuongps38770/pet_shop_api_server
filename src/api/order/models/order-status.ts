import { UserRole } from "src/api/auth/models/role.enum";
import { OrderAction } from "src/api/order-log/models/order-action.enum";

export enum OrderStatus {
    NEWORDER = "NEWORDER",              // Đơn hàng mới tạo
    CONFIRMED = "CONFIRMED",            // Đã xác nhận đơn hàng
    WAIT_FOR_PAYMENT = "WAIT_FOR_PAYMENT",//Đợi th toán nếu trả onl
    PAYMENT_SUCCESSFUL = "PAYMENT_SUCCESSFUL",
    PROCESSING = "PROCESSING",       // Đang xử lý đơn hàng
    SHIPPED = "SHIPPED",             // Đã giao cho đơn vị vận chuyển
    DELIVERED = "DELIVERED",         // Đã giao đến địa chỉ nhận
    RECEIVED = "RECEIVED",           // Khách đã nhận hàng
    CANCELLED = "CANCELLED",         // Đơn hàng đã bị hủy
    RETURNED = "RETURNED",           // Khách đã trả hàng
    FAILED = "FAILED",               // Giao hàng thất bại
    REFUNDED = "REFUNDED",           // Đã hoàn tiền
}


// quy định các type cho system đc chuyển
export const SYSTEM_STATUSES = [
    OrderStatus.REFUNDED,
    OrderStatus.RETURNED,
    OrderStatus.RECEIVED,
    OrderStatus.CANCELLED,
    OrderStatus.PAYMENT_SUCCESSFUL,
    OrderStatus.NEWORDER
] as const;
export type OrderStatusSystem = typeof SYSTEM_STATUSES[number];

// map các loại status để ghi action log
export const statusToActionMap: Record<OrderStatusSystem, OrderAction>= {
    [OrderStatus.CANCELLED]: OrderAction.CANCEL_ORDER,
    [OrderStatus.REFUNDED]: OrderAction.REFUND_ORDER,
    [OrderStatus.RETURNED]: OrderAction.RETURN_ORDER,
    [OrderStatus.RECEIVED]: OrderAction.COMPLETE_ORDER,
    [OrderStatus.PAYMENT_SUCCESSFUL]: OrderAction.CONFIRM_PAYMENT,
    [OrderStatus.NEWORDER]:OrderAction.CREATE_ORDER,
};
// export enum OrderAction {
//   CANCEL_ORDER = "CANCEL_ORDER",
//   CREATE_ORDER = "CREATE_ORDER",
//   CONFIRM_ORDER = "CONFIRM_ORDER",
//   SHIPPING_ORDER = "SHIPPING_ORDER",
//   CONFIRM_PAYMENT ="CONFIRM_PAYMENT",
//   COMPLETE_ORDER = "COMPLETE_ORDER",
//   RETURN_ORDER = "RETURN_ORDER",
//   REFUND_ORDER = "REFUND_ORDER"
// }
export const OrderStatusTransitionMap: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.NEWORDER]: [OrderStatus.WAIT_FOR_PAYMENT, OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.WAIT_FOR_PAYMENT]: [OrderStatus.PAYMENT_SUCCESSFUL, OrderStatus.CANCELLED],
    [OrderStatus.PAYMENT_SUCCESSFUL]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [OrderStatus.RECEIVED],
    [OrderStatus.RECEIVED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
    [OrderStatus.FAILED]: [OrderStatus.CANCELLED],
    [OrderStatus.REFUNDED]: [],
};

export const OrderStatusPermissionMap: Record<OrderStatus, (UserRole)[]> = {
    [OrderStatus.WAIT_FOR_PAYMENT]: [],//hệ thống
    [OrderStatus.PAYMENT_SUCCESSFUL]: [],//hệ thống
    [OrderStatus.CONFIRMED]: [UserRole.ADMIN],
    [OrderStatus.PROCESSING]: [UserRole.ADMIN],
    [OrderStatus.SHIPPED]: [UserRole.ADMIN],
    [OrderStatus.DELIVERED]: [UserRole.ADMIN],
    [OrderStatus.RECEIVED]: [UserRole.USER],
    [OrderStatus.CANCELLED]: [UserRole.USER, UserRole.ADMIN],
    [OrderStatus.REFUNDED]: [UserRole.ADMIN],
    [OrderStatus.RETURNED]: [UserRole.USER, UserRole.ADMIN],
    [OrderStatus.FAILED]: [UserRole.ADMIN],
    [OrderStatus.NEWORDER]: [], //hệ thống
};

// NEWORDER
//    ↓
// WAIT_FOR_PAYMENT
//    ↓                     ↘
// PAYMENT_SUCCESSFUL        CANCELLED (by User)
//    ↓                            ↑
// CONFIRMED                     (nếu chưa thanh toán)
//    ↓                     ↘
// PROCESSING              CANCELLED (by Admin)
//    ↓                     ↘
// SHIPPED               CANCELLED (by Admin)
//    ↓
// DELIVERED
//    ↓
// RECEIVED

// NEWORDER
//    ↓
//CONFIRMED
//    ↓
// PROCESSING
//    ↓
// SHIPPED
//    ↓
// DELIVERED



// NEWORDER
//    ↓
// CONFIRMED                ↘
//    ↓                    CANCELLED (by User or Admin)
// PROCESSING              ↘
//    ↓                 CANCELLED (by Admin)
// SHIPPED                ↘
//    ↓              CANCELLED (by Admin)
// DELIVERED
//    ↓
// RECEIVED