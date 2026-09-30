using System;
using System.Security.Claims;
using ErrorOr;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace ExpenseTracker.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BaseApiController : ControllerBase
{
    //SSoT for the UserId regarding Controllers
    //Recovers the UserId from the JWT without the chance of passing it randomly in the methods
    protected Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    protected IActionResult Problem(List<Error> errors)
    {
        if (errors.Count == 0) return Problem();

        if (errors.All(e => e.Type == ErrorType.Validation)) return ValidationProblem(errors);

        var firstError = errors[0];

        return firstError.Type switch
        {
            ErrorType.NotFound => NotFound(new { firstError.Code, firstError.Description }),
            ErrorType.Conflict => Conflict(new { firstError.Code, firstError.Description }),
            ErrorType.Unauthorized => Unauthorized(new { firstError.Code, firstError.Description }),
            ErrorType.Forbidden => StatusCode(StatusCodes.Status403Forbidden, new { firstError.Code, firstError.Description }),
            _ => StatusCode(500, new { firstError.Code, firstError.Description })
        };
    }

    private IActionResult ValidationProblem(List<Error> errors)
    {
        var modelStateDictionary = new ModelStateDictionary();

        foreach (var error in errors)
        {
            modelStateDictionary.AddModelError(error.Code, error.Description);            
        }

        return ValidationProblem(modelStateDictionary);
    }
}
