using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DTOs
{
    public record UpdateUserDTO(
     int Id,
     string? Email,

     string? FirstName ,

     string? LastName ,

     string? Address,

     string? PhoneNumber,

     bool? IsAdmin,

     string? Password

    );

}
