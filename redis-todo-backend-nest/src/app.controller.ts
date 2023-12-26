import { Controller, Get, Post, Body, Req, Res, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Post('/signup')
  signup(@Body() userData: any, @Req() req: Request, @Res() res: Response) {
    return this.appService.signup(userData, req, res);
  }

  @Post()
  login(@Body() userData: any, @Req() req: Request, @Res() res: Response) {
    return this.appService.login(userData, req, res);
  }

  @Post('/todo')
  createTodo(@Body() todoData: any, @Req() req: Request, @Res() res: Response) {
    return this.appService.createTodo(todoData, req, res);
  }

  @Get('/manager')
  getManager(@Req() req: Request, @Res() res: Response) {
    return this.appService.getManager(req, res);
  }

  @Get('/employees')
  getEmployees(@Req() req: Request, @Res() res: Response) {
    return this.appService.getEmployees(req, res);
  }

  @Get('/getTodo')
  getAllTodos(@Req() req: Request, @Res() res: Response) {
    return this.appService.getAllTodos(req, res);
  }

  @Get('/getPersonalTodos')
  getPersonalTodos(@Req() req: Request, @Res() res: Response) {
    return this.appService.getPersonalTodos(req, res);
  }

  @Get('/getCreatedTodos')
  getCreatedTodos(@Req() req: Request, @Res() res: Response) {
    return this.appService.getCreatedTodos(req, res);
  }

  @Get('/completeTodo/:id')
  completeTodo(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.appService.completeTodo(id, req, res);
  }

  @Get('/incompleteTodo/:id')
  inCompleteTodo(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.appService.inCompleteTodo(id, req, res);
  }

  @Post('createComment')
  createComment(
    @Body() comments: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.appService.createComment(comments, req, res);
  }

  @Get('getAllComments/:id')
  getAllCommentsForTodo(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.appService.getAllCommentsForTodo(id, req, res);
  }

  @Post('changeAssignedto')
  changeAssignedToById(
    @Body() assignData: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.appService.changeAssignedToById(assignData, req, res);
  }
}
