import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
// import { RedisService } from './redis/redis.service';
import { setupUserRepository } from './schema/user-schema';
import { setupTodoRepository } from './schema/todo-schema';
import { EntityId } from 'redis-om';
import { setupCommentRepository } from './schema/comment-schema';

@Injectable()
export class AppService {
  private readonly client: any;
  private userRepository: any;
  private todoRepository: any;
  private commentRepository: any;

  constructor() {
    this.setupRepositories();
  }

  private async setupRepositories(): Promise<void> {
    this.userRepository = await setupUserRepository();
    this.todoRepository = await setupTodoRepository();
    this.commentRepository = await setupCommentRepository();
  }

  getHello(): string {
    return 'Hello World!';
  }

  // async signup(userData: any, req: Request, res: Response) {
  //   const { fullName, email, password, role, manager } = userData;

  //   const existingUser = await this.client.get(`user:email:${email}`);
  //   if (existingUser) {
  //     return res
  //       .status(400)
  //       .json({ error: 'User with this email already exists' });
  //   }

  //   console.log(fullName, 'full name: ');

  //   await this.client.set(
  //     `user:email:${email}`,
  //     JSON.stringify({
  //       fullName,
  //       email,
  //       password,
  //       role,
  //       manager,
  //     }),
  //   );

  //   res.json({ success: true, message: 'User signed up successfully' });
  // }

  async signup(userData: any, req: Request, res: Response) {
    try {
      const { fullName, email, password, role, manager } = userData;
      // const userRepository = await setupUserRepository();
      // Check if user with the same email already exists
      const existingUser = await this.userRepository
        .search()
        .where('email')
        .eq(email)
        .return.all();

      if (existingUser.length > 0) {
        return res
          .status(400)
          .json({ error: 'User with this email already exists' });
      }

      // Create a new user entity
      const newUser = await this.userRepository.save({
        fullName,
        email,
        password,
        role,
        manager,
      });

      // Save the user to the repository
      // await userRepository.save(newUser);

      res.json({
        success: true,
        message: 'User signed up successfully',
        user: newUser,
      });
    } catch (error) {
      console.error('Error signing up user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // async login(userData: any, req: Request, res: Response) {
  //   const { email, password } = userData;

  //   try {
  //     const userData = await this.client.get(`user:email:${email}`);

  //     if (!userData) {
  //       return res.status(401).json({ error: 'Invalid email or password' });
  //     }

  //     const user = JSON.parse(userData);
  //     console.log(user);
  //     if (user.password !== password) {
  //       return res.status(401).json({ error: 'Invalid email or password' });
  //     }

  //     const token = jwt.sign(
  //       user,
  //       '645g6s5r4g65trg94trs6g4sr1t5gh456wretgh61stbg1tr665gh4rt6gbh56',
  //     );

  //     res.json({
  //       success: true,
  //       message: 'User logged in successfully',
  //       token,
  //     });
  //   } catch (error) {
  //     console.error('Error during login:', error);
  //     res.status(500).json({ error: 'Internal Server Error' });
  //   }
  // }

  async login(userData: any, req: Request, res: Response) {
    const { email, password } = userData;
    console.log(email, password);

    try {
      const user = await this.userRepository
        .search()
        .where('email')
        .eq(email)
        .return.all();
      console.log(user);

      if (!user) {
        console.log('in user not found');

        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (user[0].password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      user[0].entityId = user[0][EntityId];
      const token = jwt.sign(
        user[0],
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

  // async createTodo(todoData: any, req: Request, res: Response) {
  //   console.log('createTodo');
  //   const {
  //     createdBy,
  //     assigned_to,
  //     todo,
  //     due_date_time,
  //     fullName,
  //     is_completed,
  //     id,
  //   } = todoData;

  //   const decodedToken = this.verifyToken(
  //     req.headers.authorization.split(' ')[1],
  //   ) as { email: string } | null;

  //   if (!decodedToken) {
  //     return res.status(401).json({ error: 'Invalid token' });
  //   }

  //   const { email } = decodedToken;

  //   await this.client.set(
  //     `todo:${uuidv4()}:${email}`,
  //     JSON.stringify({
  //       createdBy,
  //       assigned_to,
  //       todo,
  //       due_date_time,
  //       fullName,
  //       is_completed,
  //       id,
  //     }),
  //   );

  //   res.json({ success: true, message: 'Todo created successfully' });
  // }

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
    ) as { email: string; entityId: string } | null;

    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { email, entityId: userId } = decodedToken;
    console.log(userId);

    const createdTodo = await this.todoRepository.save({
      userId,
      createdBy,
      assigned_to,
      todo,
      due_date_time,
      fullName,
      is_completed,
      id,
    });

    return res.json({
      success: true,
      message: 'Todo created successfully',
      createdTodo: createdTodo,
    });
  }

  async getManager(req: Request, res: Response) {
    // const keys = await this.client.keys(`user:email:*`);
    const users = await this.userRepository
      .search()
      .where('role')
      .eq('manager')
      .return.all();
    console.log(users);
    // const users = [];

    // for (const key of keys) {
    //   const userData = await this.client.get(key);
    //   const user = JSON.parse(userData);

    //   if (user.role === 'manager') {
    //     users.push(user);
    //   }
    // }

    res.json(users);
  }

  async getEmployees(req: Request, res: Response) {
    const decodedToken = this.verifyToken(
      req.headers.authorization.split(' ')[1],
    ) as { email: string } | null;

    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { email } = decodedToken;
    const users = await this.userRepository
      .search()
      .where('manager')
      .eq(email)
      .return.all();
    // for (const key of keys) {
    //   const userData = await this.client.get(key);
    //   const user = JSON.parse(userData);

    //   if (user.manager === email) {
    //     users.push(user);
    //   }
    // }

    res.json(users);
  }

  // async getCreatedTodos(req: Request, res: Response) {
  //   try {
  //     const decodedToken = this.verifyToken(
  //       req.headers.authorization.split(' ')[1],
  //     ) as { email: string } | null;

  //     if (!decodedToken) {
  //       return res.status(401).json({ error: 'Invalid token' });
  //     }

  //     const { email } = decodedToken;

  //     const todosKeys = await this.client.keys(`todo:*`);

  //     const todos = [];

  //     for (const key of todosKeys) {
  //       const todoData = await this.client.get(key);
  //       const todo = JSON.parse(todoData);

  //       if (todo.createdBy === email) {
  //         todos.push(todo);
  //       }
  //     }

  //     res.json(todos);
  //   } catch (error) {
  //     console.error('Error fetching todos:', error.message);
  //     res
  //       .status(500)
  //       .json({ success: false, message: 'Internal Server Error' });
  //   }
  // }

  async getCreatedTodos(req: Request, res: Response) {
    try {
      const decodedToken = this.verifyToken(
        req.headers.authorization.split(' ')[1],
      ) as { email: string; entityId: string } | null;

      if (!decodedToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { email, entityId: userId } = decodedToken;

      const todos = await this.todoRepository
        .search()
        .where('userId')
        .eq(userId)
        .return.all();
      res.json(todos);
    } catch (error) {
      console.error('Error fetching todos:', error.message);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }

  // async getAllTodos(req: Request, res: Response) {
  //   try {
  //     const decodedToken = this.verifyToken(
  //       req.headers.authorization.split(' ')[1],
  //     ) as { email: string } | null;

  //     if (!decodedToken) {
  //       return res.status(401).json({ error: 'Invalid token' });
  //     }

  //     const { email } = decodedToken;
  //     const todosKeys = await this.client.keys(`todo:*`);
  //     const todos = await Promise.all(
  //       todosKeys.map(async (key) => {
  //         const todo = await this.client.get(key);
  //         return JSON.parse(todo);
  //       }),
  //     );

  //     res.json(todos);
  //   } catch (error) {
  //     console.error('Error fetching todos:', error.message);
  //     res
  //       .status(500)
  //       .json({ success: false, message: 'Internal Server Error' });
  //   }
  // }

  async getAllTodos(req: Request, res: Response) {
    try {
      const decodedToken = this.verifyToken(
        req.headers.authorization.split(' ')[1],
      ) as { email: string } | null;

      if (!decodedToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { email } = decodedToken;

      const todos = await this.todoRepository.search().return.all();
      res.json(todos);
    } catch (error) {
      console.error('Error fetching todos:', error.message);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }

  // async getPersonalTodos(req: Request, res: Response) {
  //   try {
  //     const decodedToken = this.verifyToken(
  //       req.headers.authorization.split(' ')[1],
  //     ) as { email: string } | null;

  //     if (!decodedToken) {
  //       return res.status(401).json({ error: 'Invalid token' });
  //     }

  //     const { email } = decodedToken;

  //     const todosKeys = await this.client.keys(`todo:*`);

  //     const todos = [];

  //     for (const key of todosKeys) {
  //       const todoData = await this.client.get(key);
  //       const todo = JSON.parse(todoData);

  //       if (todo.assigned_to === email) {
  //         todos.push(todo);
  //       }
  //     }

  //     res.json(todos);
  //   } catch (error) {
  //     console.error('Error fetching todos:', error.message);
  //     res
  //       .status(500)
  //       .json({ success: false, message: 'Internal Server Error' });
  //   }
  // }

  async getPersonalTodos(req: Request, res: Response) {
    try {
      const decodedToken = this.verifyToken(
        req.headers.authorization.split(' ')[1],
      ) as { email: string } | null;

      if (!decodedToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { email } = decodedToken;

      const todos = await this.todoRepository
        .search()
        .where('assigned_to')
        .eq(email)
        .return.all();
      res.json(todos);
    } catch (error) {
      console.error('Error fetching todos:', error.message);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }

  // async completeTodo(id: string, req: Request, res: Response) {
  //   const token = req.headers.authorization.split(' ')[1];
  //   const decoded = this.verifyToken(token);
  //   if (!decoded) {
  //     return res.status(401).json({ error: 'Invalid token' });
  //   }
  //   const keys = await this.client.keys(`todo:*`);

  //   for (const key of keys) {
  //     const todoData = await this.client.get(key);
  //     const todo = JSON.parse(todoData);
  //     if (todo.id === id) {
  //       todo.is_completed = true;
  //       this.client.set(key, JSON.stringify(todo));
  //       return res.json({
  //         success: true,
  //         message: 'Todo is completed successfully',
  //       });
  //     }
  //   }
  //   return res.status(401).json({ error: 'Todo not found' });
  // }

  async completeTodo(id: string, req: Request, res: Response) {
    try {
      const todo = await this.todoRepository
        .search()
        .where('id')
        .eq(id)
        .return.first();

      if (!todo) {
        return res.status(404).json({ error: 'Todo not found' });
      }

      todo.is_completed = true;
      await this.todoRepository.save(todo);

      return res.json({
        success: true,
        message: 'Todo is completed successfully',
      });
    } catch (error) {
      console.error('Error completing todo:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async inCompleteTodo(id: string, req: Request, res: Response) {
    try {
      const todo = await this.todoRepository
        .search()
        .where('id')
        .eq(id)
        .return.first();

      if (!todo) {
        return res.status(404).json({ error: 'Todo not found' });
      }

      todo.is_completed = false;
      await this.todoRepository.save(todo);

      return res.json({
        success: true,
        message: 'Todo is completed successfully',
      });
    } catch (error) {
      console.error('Error completing todo:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // async createComment(comments: any, req: Request, res: Response) {
  //   const { todo_id, comment } = comments;

  //   const token = req.headers.authorization.split(' ')[1];
  //   const decoded = this.verifyToken(token);
  //   if (!decoded) {
  //     return res.status(401).json({ error: 'Invalid token' });
  //   }

  //   await this.client.set(
  //     `comments:${uuidv4()}:${todo_id}`,
  //     JSON.stringify({
  //       todo_id,
  //       comment,
  //     }),
  //   );

  //   res.json({ success: true, message: 'comment created successfully' });
  // }

  async createComment(comments: any, req: Request, res: Response) {
    try {
      const { todo_id, comment } = comments;

      const token = req.headers.authorization.split(' ')[1];
      const decoded = this.verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Assuming this.commentRepository is an instance of your Repository
      const createdTodo = await this.commentRepository.save({
        todo_id,
        comment,
      });

      res.json({ success: true, message: 'Comment created successfully' });
    } catch (error) {
      console.error('Error creating comment:', error);

      return res.status(400).json({ error: 'Error creating comment' });
    }
  }

  // async getAllCommentsForTodo(id: string, req: Request, res: Response) {
  //   try {
  //     console.log(id);
  //     const commentsKeys = await this.client.keys(`comments:*:${id}`);

  //     const comments = await Promise.all(
  //       commentsKeys.map(async (key) => {
  //         const commentData = await this.client.get(key);
  //         return JSON.parse(commentData);
  //       }),
  //     );

  //     res.json(comments);
  //   } catch (error) {
  //     console.error('Error fetching comments:', error.message);
  //     res
  //       .status(500)
  //       .json({ success: false, message: 'Internal Server Error' });
  //   }
  // }

  async getAllCommentsForTodo(id: string, req: Request, res: Response) {
    try {
      console.log(id);

      const comments = await this.commentRepository
        .search()
        .where('todo_id')
        .eq(id)
        .return.all();

      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error.message);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }

  // async changeAssignedToById(assignData: any, req: Request, res: Response) {
  //   try {
  //     const { id, new_assigned_to, fullName } = assignData;
  //     console.log(id, new_assigned_to, fullName, 'data changed');
  //     const token = req.headers.authorization.split(' ')[1];
  //     const decoded = this.verifyToken(token);
  //     if (!decoded) {
  //       return res.status(401).json({ error: 'Invalid token' });
  //     }

  //     const todosKeys = await this.client.keys(`todo:*`);

  //     for (const key of todosKeys) {
  //       const todoData = await this.client.get(key);
  //       const todo = JSON.parse(todoData);
  //       if (todo.id === id) {
  //         todo.assigned_to = new_assigned_to;
  //         todo.fullName = fullName;
  //         this.client.set(key, JSON.stringify(todo));
  //         return res.json({
  //           success: true,
  //           message: 'Assigned_to updated successfully',
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error changing assigned_to by id:', error.message);
  //     res
  //       .status(500)
  //       .json({ success: false, message: 'Internal Server Error' });
  //   }
  // }

  async changeAssignedToById(assignData: any, req: Request, res: Response) {
    try {
      const { id, new_assigned_to, fullName } = assignData;
      console.log(id, new_assigned_to, fullName, 'data changed');
      const token = req.headers.authorization.split(' ')[1];
      const decoded = this.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const todo = await this.todoRepository
        .search()
        .where('id')
        .eq(id)
        .return.first();

      if (!todo) {
        return res.status(404).json({ error: 'Todo not found' });
      }

      todo.assigned_to = new_assigned_to;
      todo.fullName = fullName;
      await this.todoRepository.save(todo);

      return res.json({
        success: true,
        message: 'assigned to changed successfully',
      });
    } catch (error) {
      console.error('Error changing assigned_to by id:', error.message);
      return res
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
