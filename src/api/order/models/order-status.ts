export enum OrderStatus {
    NEWORDER = "NEWORDER",              // Đơn hàng mới tạo
    CONFIRMED = "CONFIRMED",            // Đã xác nhận đơn hàng
    WAIT_FOR_PAYMENT="WAIT_FOR_PAYMENT",//Đợi th toán nếu trả onl
    PAYMENT_SUCCESSFUL="PAYMENT_SUCCESSFUL",
    PROCESSING = "PROCESSING",       // Đang xử lý đơn hàng
    SHIPPED = "SHIPPED",             // Đã giao cho đơn vị vận chuyển
    DELIVERED = "DELIVERED",         // Đã giao đến địa chỉ nhận
    RECEIVED = "RECEIVED",           // Khách đã nhận hàng
    CANCELLED = "CANCELLED",         // Đơn hàng đã bị hủy
    RETURNED = "RETURNED",           // Khách đã trả hàng
    FAILED = "FAILED",               // Giao hàng thất bại
    REFUNDED = "REFUNDED"            // Đã hoàn tiền
}