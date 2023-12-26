import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

@Injectable()
export class AppService {
  private readonly client: any;
  constructor() {
    this.client = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }

  getHello(): string {
    return 'Hello World!';
  }

  async signup(userData: any, req: Request, res: Response) {
    const { fullName, email, password, role, manager } = userData;

    const existingUser = await this.client.get(`user:email:${email}`);
    if (existingUser) {
      return res
        .status(400)
        .json({ error: 'User with this email already exists' });
    }

    console.log(fullName, 'full name: ');

    await this.client.set(
      `user:email:${email}`,
      JSON.stringify({
        fullName,
        email,
        password,
        role,
        manager,
      }),
    );

    res.json({ success: true, message: 'User signed up successfully' });
  }

  async login(userData: any, req: Request, res: Response) {
    const { email, password } = userData;

    try {
      const userData = await this.client.get(`user:email:${email}`);

      if (!userData) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = JSON.parse(userData);
      console.log(user);
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        user,
        '645g6s5r4g65trg94trs6g4sr1t5gh456wretgh61stbg1tr665gh4rt6gbh56',
      );

      res.json({
        success: true,
        message: 'User logged in successfully',
        token,
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async createTodo(todoData: any, req: Request, res: Response) {
    console.log('createTodo');
    const {
      createdBy,
      assigned_to,
      todo,
      due_date_time,
      fullName,
      is_completed,
      id,
    } = todoData;

    const decodedToken = this.verifyToken(
      req.headers.authorization.split(' ')[1],
    ) as { email: string } | null;

    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { email } = decodedToken;

    await this.client.set(
      `todo:${uuidv4()}:${email}`,
      JSON.stringify({
        createdBy,
        assigned_to,
        todo,
        due_date_time,
        fullName,
        is_completed,
        id,
      }),
    );

    res.json({ success: true, message: 'Todo created successfully' });
  }

  async getManager(req: Request, res: Response) {
    const keys = await this.client.keys(`user:email:*`);

    const users = [];

    for (const key of keys) {
      const userData = await this.client.get(key);
      const user = JSON.parse(userData);

      if (user.role === 'manager') {
        users.push(user);
      }
    }

    res.json(users);
  }

  async getEmployees(req: Request, res: Response) {
    const keys = await this.client.keys(`user:email:*`);

    const users = [];

    const decodedToken = this.verifyToken(
      req.headers.authorization.split(' ')[1],
    ) as { email: string } | null;

    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { email } = decodedToken;

    for (const key of keys) {
      const userData = await this.client.get(key);
      const user = JSON.parse(userData);

      if (user.manager === email) {
        users.push(user);
      }
    }

    res.json(users);
  }

  async getCreatedTodos(req: Request, res: Response) {
    try {
      const decodedToken = this.verifyToken(
        req.headers.authorization.split(' ')[1],
      ) as { email: string } | null;

      if (!decodedToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { email } = decodedToken;

      const todosKeys = await this.client.keys(`todo:*`);

      const todos = [];

      for (const key of todosKeys) {
        const todoData = await this.client.get(key);
        const todo = JSON.parse(todoData);

        if (todo.createdBy === email) {
          todos.push(todo);
        }
      }

      res.json(todos);
    } catch (error) {
      console.error('Error fetching todos:', error.message);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }

  async getAllTodos(req: Request, res: Response) {
    try {
      const decodedToken = this.verifyToken(
        req.headers.authorization.split(' ')[1],
      ) as { email: string } | null;

      if (!decodedToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { email } = decodedToken;
      const todosKeys = await this.client.keys(`todo:*`);
      const todos = await Promise.all(
        todosKeys.map(async (key) => {
          const todo = await this.client.get(key);
          return JSON.parse(todo);
        }),
      );

      res.json(todos);
    } catch (error) {
      console.error('Error fetching todos:', error.message);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }

  async getPersonalTodos(req: Request, res: Response) {
    try {
      const decodedToken = this.verifyToken(
        req.headers.authorization.split(' ')[1],
      ) as { email: string } | null;

      if (!decodedToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { email } = decodedToken;

      const todosKeys = await this.client.keys(`todo:*`);

      const todos = [];

      for (const key of todosKeys) {
        const todoData = await this.client.get(key);
        const todo = JSON.parse(todoData);

        if (todo.assigned_to === email) {
          todos.push(todo);
        }
      }

      res.json(todos);
    } catch (error) {
      console.error('Error fetching todos:', error.message);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }

  async completeTodo(id: string, req: Request, res: Response) {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = this.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const keys = await this.client.keys(`todo:*`);

    for (const key of keys) {
      const todoData = await this.client.get(key);
      const todo = JSON.parse(todoData);
      if (todo.id === id) {
        todo.is_completed = true;
        this.client.set(key, JSON.stringify(todo));
        return res.json({
          success: true,
          message: 'Todo is completed successfully',
        });
      }
    }
    return res.status(401).json({ error: 'Todo not found' });
  }

  async inCompleteTodo(id: string, req: Request, res: Response) {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = this.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const keys = await this.client.keys(`todo:*`);

    for (const key of keys) {
      const todoData = await this.client.get(key);
      const todo = JSON.parse(todoData);
      if (todo.id === id) {
        todo.is_completed = false;
        this.client.set(key, JSON.stringify(todo));
        return res.json({
          success: true,
          message: 'Todo is completed successfully',
        });
      }
    }
    return res.status(401).json({ error: 'Todo not found' });
  }

  async createComment(comments: any, req: Request, res: Response) {
    const { todo_id, comment } = comments;

    const token = req.headers.authorization.split(' ')[1];
    const decoded = this.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await this.client.set(
      `comments:${uuidv4()}:${todo_id}`,
      JSON.stringify({
        todo_id,
        comment,
      }),
    );

    res.json({ success: true, message: 'comment created successfully' });
  }

  async getAllCommentsForTodo(id: string, req: Request, res: Response) {
    try {
      console.log(id);
      const commentsKeys = await this.client.keys(`comments:*:${id}`);

      const comments = await Promise.all(
        commentsKeys.map(async (key) => {
          const commentData = await this.client.get(key);
          return JSON.parse(commentData);
        }),
      );

      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error.message);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }

  async changeAssignedToById(assignData: any, req: Request, res: Response) {
    try {
      const { id, new_assigned_to, fullName } = assignData;
      console.log(id, new_assigned_to, fullName, 'data changed');
      const token = req.headers.authorization.split(' ')[1];
      const decoded = this.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const todosKeys = await this.client.keys(`todo:*`);

      for (const key of todosKeys) {
        const todoData = await this.client.get(key);
        const todo = JSON.parse(todoData);
        if (todo.id === id) {
          todo.assigned_to = new_assigned_to;
          todo.fullName = fullName;
          this.client.set(key, JSON.stringify(todo));
          return res.json({
            success: true,
            message: 'Assigned_to updated successfully',
          });
        }
      }
    } catch (error) {
      console.error('Error changing assigned_to by id:', error.message);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }

  verifyToken = (token: string) => {
    try {
      const decoded = jwt.verify(
        token,
        '645g6s5r4g65trg94trs6g4sr1t5gh456wretgh61stbg1tr665gh4rt6gbh56',
      );
      return decoded;
    } catch (error) {
      console.error('Error verifying token:', error.message);
      return 'null';
    }
  };
}
