using Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly ApiDBContext _apiDbContext;
        public OrderRepository(ApiDBContext apiDbContext)
        {
            _apiDbContext = apiDbContext;
        }
        public async Task<IEnumerable<Order>> GetOrders()
        {
            return await _apiDbContext.Orders.ToListAsync();
        }
        public async Task<Order> GetOrderById(int id)
        {
            return await _apiDbContext.Orders.Include(order=>order.OrderItems).ThenInclude(orderItem=> orderItem.Product).FirstOrDefaultAsync(order => order.Id==id);
        }

        public async Task<Order> AddOrder(Order newOrder)
        {
            await _apiDbContext.Orders.AddAsync(newOrder);
            await _apiDbContext.SaveChangesAsync();
            return newOrder;
        }
        public async Task UpdateOrder(int id, Order updateOrder)
        {
            var existingOrder = await _apiDbContext.Orders.FindAsync(id);
            if (existingOrder != null)
            {
                existingOrder.OrderDate = updateOrder.OrderDate;
                existingOrder.OrderSum = updateOrder.OrderSum;
                existingOrder.Status = updateOrder.Status;
                await _apiDbContext.SaveChangesAsync();
            }
        }
    }
}
