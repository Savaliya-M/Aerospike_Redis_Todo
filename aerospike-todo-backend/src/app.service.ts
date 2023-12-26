import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { AerospikeService } from './aerospike/aerospike.service';
import * as Aerospike from 'aerospike';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AppService {
  constructor(private aerospike: AerospikeService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async signup(userData: any, req: Request, res: Response): Promise<boolean> {
    const { fullName, email, password, role, manager } = userData;

    try {
      const key = new Aerospike.Key('test', 'users', email);
      const newUser = { fullName, email, password, role, manager };
      const policy = {
        exists: Aerospike.policy.exists.CREATE,
        key: Aerospike.policy.key.SEND,
      };

      const result = await this.aerospike.put(key, newUser, policy);

      if (result.success) {
        console.log(result.message);
        res
          .status(201)
          .json({ success: true, message: 'User signed up successfully' });
      } else {
        console.log(result.message);
        res
          .status(409)
          .json({ success: false, message: 'Record already exists' });
      }

      return result.success;
    } catch (error) {
      console.error('Error during signup:', error);
      res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
      return false;
    }
  }

  async login(userData: any, req: Request, res: Response) {
    const { email, password } = userData;

    try {
      const key = new Aerospike.Key('test', 'users', email);
      const record = await this.aerospike.get(key);

      if (!record.success) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = record.data;

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

  // async createTodo(todoData: any, req: Request, res: Response) {
  //   try {
  //     const {
  //       createdBy,
  //       assigned_to,
  //       todo,
  //       due_date_time,
  //       fullName,
  //       is_completed,
  //       id,
  //     } = todoData;

  //     const decodedToken = this.verifyToken(
  //       req.headers.authorization.split(' ')[1],
  //     ) as { email: string } | null;

  //     if (!decodedToken) {
  //       return res.status(401).json({ error: 'Invalid token' });
  //     }

  //     const { email } = decodedToken;
  //     const userKey = new Aerospike.Key('test', 'todos', email);

  //     const record = await this.aerospike.get(userKey);

  //     const existingTodos = record ? record['todos'] || [] : [];

  //     const newTodo = {
  //       createdBy,
  //       assigned_to,
  //       todo,
  //       due_date_time,
  //       fullName,
  //       is_completed,
  //       id,
  //     };

  //     existingTodos.push(newTodo);

  //     const operationResult = await this.aerospike.operate(userKey, [
  //       Aerospike.operations.write('todos', existingTodos),
  //     ]);

  //     if (operationResult.success) {
  //       console.log('Successfully stored todo data');
  //       res.json({ success: true, message: 'Todo created successfully' });
  //     } else {
  //       console.error('Error during operate operation:', operationResult.error);
  //       if (
  //         operationResult.error.code ===
  //         Aerospike.status.AEROSPIKE_ERR_RECORD_EXISTS
  //       ) {
  //         console.info('Record already exists');
  //         res
  //           .status(409)
  //           .json({ success: false, message: 'Record already exists' });
  //       } else {
  //         res
  //           .status(500)
  //           .json({ success: false, message: 'Internal server error' });
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error during createTodo:', error);
  //     res
  //       .status(500)
  //       .json({ success: false, message: 'Internal server error' });
  //   }
  // }

  async createTodo(todoData: any, req: Request, res: Response) {
    try {
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
      const userKey = new Aerospike.Key('test', 'todos', email);

      const record = await this.aerospike.get(userKey);

      const existingTodos = record ? record.data.todos || [] : [];
      console.log(existingTodos, 'created Todos', record);

      const newTodo = {
        createdBy,
        assigned_to,
        todo,
        due_date_time,
        fullName,
        is_completed,
        id,
      };

      existingTodos.push(newTodo);
      const policy = {
        // exists: Aerospike.policy.exists.CREATE,
        key: Aerospike.policy.key.SEND,
      };

      const operationResult = await this.aerospike.put(
        userKey,
        {
          todos: existingTodos,
        },
        policy,
      );

      if (operationResult.success) {
        console.log('Successfully stored todo data');
        res.json({ success: true, message: 'Todo created successfully' });
      } else {
        console.error('Error during put operation:', operationResult.message);
        // if (
        //     operationResult.error.code ===
        //     Aerospike.status.AEROSPIKE_ERR_RECORD_EXISTS
        // ) {
        //     console.info('Record already exists');
        //     res
        //         .status(409)
        //         .json({ success: false, message: 'Record already exists' });
        // } else {
        res
          .status(500)
          .json({ success: false, message: 'Internal server error' });
        // }
      }
    } catch (error) {
      console.error('Error during createTodo:', error);
      res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  }

  async getManager(req: Request, res: Response) {
    try {
      const records = await this.aerospike.queryRecords('users');

      const users = records
        .filter((record) => record.bins && record.bins.role === 'manager')
        .map((record) => record.bins);

      // disconnectFromAerospike(); // Disconnect after the scan

      res.json(users);
    } catch (error) {
      console.error('Error during getManager:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getEmployees(req: Request, res: Response) {
    try {
      const records = await this.aerospike.queryRecords('users');

      const decodedToken = this.verifyToken(
        req.headers.authorization.split(' ')[1],
      ) as { email: string } | null;

      if (!decodedToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { email } = decodedToken;

      const users = records
        .filter((record) => record.bins && record.bins.manager === email)
        .map((record) => record.bins);

      res.json(users);
    } catch (error) {
      console.error('Error during getEmployees:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
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

      const userKey = new Aerospike.Key('test', 'todos', email);

      const records = await this.aerospike.get(userKey);

      const todos = records.data.todos;

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
      const records = await this.aerospike.queryRecords('todos');

      const todos = records.flatMap((record) => record.bins.todos);

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

      const records = await this.aerospike.queryRecords('todos');

      const todos = records.map((record) => record.bins.todos).flat();

      const filteredTodos = todos.filter((todo) => todo.assigned_to === email);

      res.json(filteredTodos);
    } catch (error) {
      console.error('Error fetching todos:', error.message);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }

  async completeTodo(id: string, req: Request, res: Response) {
    try {
      const decodedToken = this.verifyToken(
        req.headers.authorization.split(' ')[1],
      ) as { email: string } | null;

      if (!decodedToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { email } = decodedToken;

      const userKeys = await this.aerospike.queryRecords('todos');
      const policy = {
        key: Aerospike.policy.key.SEND,
      };
      for (const userKey of userKeys) {
        const { data: userData } = await this.aerospike.get(userKey.key);

        if (userData && userData.todos) {
          const todoIndex = userData.todos.findIndex((todo) => todo.id === id);

          if (todoIndex !== -1) {
            userData.todos[todoIndex].is_completed = true;

            await this.aerospike.put(userKey.key, userData, policy);

            return res.json({
              success: true,
              message: 'Todo is completed successfully',
            });
          }
        }
      }

      return res.status(404).json({ error: 'Todo not found' });
    } catch (error) {
      console.error('Error completing todo:', error.message);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }

  async inCompleteTodo(id: string, req: Request, res: Response) {
    try {
      const decodedToken = this.verifyToken(
        req.headers.authorization.split(' ')[1],
      ) as { email: string } | null;

      if (!decodedToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { email } = decodedToken;

      const userKeys = await this.aerospike.queryRecords('todos');
      const policy = {
        key: Aerospike.policy.key.SEND,
      };
      for (const userKey of userKeys) {
        const { data: userData } = await this.aerospike.get(userKey.key);

        if (userData && userData.todos) {
          const todoIndex = userData.todos.findIndex((todo) => todo.id === id);

          if (todoIndex !== -1) {
            userData.todos[todoIndex].is_completed = false;

            await this.aerospike.put(userKey.key, userData, policy);

            return res.json({
              success: true,
              message: 'Todo is completed successfully',
            });
          }
        }
      }

      return res.status(404).json({ error: 'Todo not found' });
    } catch (error) {
      console.error('Error completing todo:', error.message);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }

  async createComment(comments: any, req: Request, res: Response) {
    try {
      const { todo_id, comment } = comments;

      const decodedToken = this.verifyToken(
        req.headers.authorization.split(' ')[1],
      ) as { email: string } | null;

      if (!decodedToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      const policy = {
        // exists: Aerospike.policy.exists.CREATE,
        key: Aerospike.policy.key.SEND,
      };
      const commentKey = new Aerospike.Key('test', 'comments', uuidv4());

      await this.aerospike.put(commentKey, { todo_id, comment }, policy);

      res.json({ success: true, message: 'Comment created successfully' });
    } catch (error) {
      console.error('Error creating comment:', error.message);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }

  async getAllCommentsForTodo(id: string, req: Request, res: Response) {
    try {
      console.log(id);

      const commentsRecords = await this.aerospike.queryRecords('comments');

      const comments = commentsRecords
        .filter((record) => record.bins.todo_id === id)
        .map((record) => record.bins);

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

      const decodedToken = this.verifyToken(
        req.headers.authorization.split(' ')[1],
      ) as { email: string } | null;

      if (!decodedToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { email } = decodedToken;

      const userKeys = await this.aerospike.queryRecords('todos');
      const policy = {
        // exists: Aerospike.policy.exists.CREATE,
        key: Aerospike.policy.key.SEND,
      };
      for (const userKey of userKeys) {
        const { data: userData } = await this.aerospike.get(userKey.key);

        if (userData && userData.todos) {
          const todoIndex = userData.todos.findIndex((todo) => todo.id === id);

          if (todoIndex !== -1) {
            userData.todos[todoIndex].assigned_to = new_assigned_to;
            userData.todos[todoIndex].fullName = fullName;

            await this.aerospike.put(userKey.key, userData, policy);

            return res.json({
              success: true,
              message: 'Todo is completed successfully',
            });
          }
        }
      }

      return res.status(404).json({ error: 'Todo not found' });
    } catch (error) {
      console.error('Error completing todo:', error.message);
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
