using DTOs;
using Entities;
using Microsoft.AspNetCore.Mvc;
using Services;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace WebApiShop.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductsController(IProductService productService)
        {
            _productService = productService;
        }
        // GET: api/<CategoriesController>
        [HttpGet]
        public async Task<ActionResult<List<ProductDTO>>> Get( [FromQuery] int?[] categoryIds,string? description,int? maxPrice,int? minPrice, int skip = 8,int position=1)
        {
            List<ProductDTO> response = await _productService.GetProducts(position,skip,categoryIds, description, maxPrice,minPrice);
            if (response.Count() > 0)
                return Ok(response);
            return NoContent();
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDTO>> Get(int id)
        {
            ProductDTO product = await _productService.GetProductById(id);
            if (product == null)
                return NotFound();
            return Ok(product);
        }

        // POST api/<UsersController>
        [HttpPost]
        public async Task<ActionResult<ProductDTO>> Post([FromBody] PostProductDTO newProduct)
        {
            ProductDTO returnedProduct = await _productService.AddProduct(newProduct);
            if (returnedProduct == null)
                return BadRequest();
            return CreatedAtAction(nameof(Get), new { id = returnedProduct.Id }, returnedProduct);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] PostProductDTO updateProduct)
        {
            await _productService.UpdateProduct(id, updateProduct);
            return NoContent();
        }

    }
}
