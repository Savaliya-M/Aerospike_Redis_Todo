import express from 'express';
const mainRouter = express.Router();

import { signup, login, getManager, createTodo, getEmployees, getAllTodos, getPersonalTodos, completeTodo, inCompleteTodo, createComment, getAllCommentsForTodo, changeAssignedToById, getCreatedTodos } from '../Controllers/index.js';

// import { signup, login, getManager, createTodo, getEmployees, getCreatedTodos, getAllTodos, getPersonalTodos, completeTodo, inCompleteTodo, createComment, getAllCommentsForTodo, changeAssignedToById } from '../Controllers/aerospikeController.js';

mainRouter.post('/', login);
mainRouter.post('/signup', signup);
mainRouter.post('/todo', createTodo);
mainRouter.get('/manager', getManager);
mainRouter.get('/employees', getEmployees);
mainRouter.get('/getTodo', getAllTodos);
mainRouter.get('/getPersonalTodos', getPersonalTodos);
mainRouter.get('/getCreatedTodos', getCreatedTodos);
mainRouter.get('/completeTodo/:id', completeTodo);
mainRouter.get('/incompleteTodo/:id', inCompleteTodo);
mainRouter.post('/createComment', createComment);
mainRouter.get('/getAllComments/:id', getAllCommentsForTodo);
mainRouter.post('/changeAssignedto', changeAssignedToById)

export default mainRouter;
