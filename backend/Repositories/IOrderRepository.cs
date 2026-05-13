using Entities;

namespace Repositories
{
    public interface IOrderRepository
    {
        Task<IEnumerable<Order>> GetOrders();
        Task<Order> AddOrder(Order newOrder);
        Task<Order> GetOrderById(int id);
        Task UpdateOrder(int id, Order updateOrder);

    }
}