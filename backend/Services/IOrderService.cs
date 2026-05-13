using DTOs;
using Entities;

namespace Services
{
    public interface IOrderService
    {
        Task<IEnumerable<OrderDTO>> GetOrders();
        Task<OrderDTO> AddOrder(OrderDTO order);
        Task<OrderDTO> GetOrderById(int id);
        Task UpdateOrder(int id, OrderDTO order);

    }
}