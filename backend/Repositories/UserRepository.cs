using Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ApiDBContext _apiDbContext;

        public UserRepository(ApiDBContext apiDbContext)
        {
            _apiDbContext = apiDbContext;
        }
        public async Task<IEnumerable<User>> GetUsers()
        {
            return await _apiDbContext.Users.ToListAsync();
        }

        public async Task<User> GetUserById(int id)
        {
            return await _apiDbContext.Users.FindAsync(id);
        }
        public async Task<IEnumerable<Order>> GetUsersOrders(int userId)
        {
            return await _apiDbContext.Orders.Include(order => order.OrderItems).ThenInclude(item => item.Product).Where(order => order.UserId == userId).ToListAsync();
        }

        public async Task<User> AddUser(User newUser)
        {
            await _apiDbContext.Users.AddAsync(newUser);
            await _apiDbContext.SaveChangesAsync();
            return newUser;
        }

        public async Task UpdateUser(int id, User updateUser)
        {
            User user = await _apiDbContext.Users.FindAsync(updateUser.Id);
            if (updateUser.Email != null)
                user.Email = updateUser.Email;
            if (updateUser.Password != null)
                user.Password = updateUser.Password;
            if (updateUser.FirstName != null)
                user.FirstName = updateUser.FirstName;
            if (updateUser.LastName != null)
                user.LastName = updateUser.LastName;
            if(updateUser.IsAdmin != null)
                user.IsAdmin= updateUser.IsAdmin;
            _apiDbContext.Users.Update(user);
            await _apiDbContext.SaveChangesAsync();
        }

        public async Task<User> Login(string email, string password)
        {
            return await _apiDbContext.Users.Include(user => user.Orders).FirstOrDefaultAsync(user => user.Email == email && user.Password == password);
        }

        public async Task<bool> UserWithSameEmail(string email, int id)
        {
            User userWithSameEmail;
            if (id < 0)
            {
                userWithSameEmail = await _apiDbContext.Users.FirstOrDefaultAsync(user => user.Email == email);
            }
            else
            {
                userWithSameEmail = await _apiDbContext.Users.FirstOrDefaultAsync(user => user.Email == email && user.Id != id);
            }
            if (userWithSameEmail == null)
                return true;
            return false;
        }
    }
}
