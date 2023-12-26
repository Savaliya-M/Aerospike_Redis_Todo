import { client } from "../redisClient.js";
import jwt from 'jsonwebtoken';
import { todo } from "node:test";
import { v4 as uuidv4 } from "uuid";

const signup = async (req, res) => {
    const {
        fullName,
        email,
        password,
        role,
        manager,
    } = req.body;

    const existingUser = await client.get(`user:email:${email}`);
    if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
    }

    console.log(fullName, "full name: ");


    await client.set(`user:email:${email}`, JSON.stringify({
        fullName,
        email,
        password,
        role,
        manager,
    }));

    res.json({ success: true, message: 'User signed up successfully' });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userData = await client.get(`user:email:${email}`);

        if (!userData) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = JSON.parse(userData);
        console.log(user);
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(user, "645g6s5r4g65trg94trs6g4sr1t5gh456wretgh61stbg1tr665gh4rt6gbh56");

        res.json({ success: true, message: 'User logged in successfully', token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const createTodo = async (req, res) => {
    console.log("createTodo");
    const {
        createdBy,
        assigned_to,
        todo,
        due_date_time,
        fullName,
        is_completed,
        id
    } = req.body;

    const token = req.headers.authorization.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { email } = decoded;

    await client.set(`todo:${uuidv4()}:${email}`, JSON.stringify({
        createdBy,
        assigned_to,
        todo,
        due_date_time,
        fullName,
        is_completed,
        id
    }));

    res.json({ success: true, message: 'Todo created successfully' });
}

const getManager = async (req, res) => {
    const keys = await client.keys(`user:email:*`);

    const users = [];

    for (const key of keys) {
        const userData = await client.get(key);
        const user = JSON.parse(userData);

        if (user.role === "manager") {
            users.push(user);
        }
    }

    res.json(users);
};

const getAllTodos = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const { email } = decoded;

        const todosKeys = await client.keys(`todo:*`);
        const todos = await Promise.all(
            todosKeys.map(async (key) => {
                const todo = await client.get(key);
                return JSON.parse(todo);
            })
        );

        res.json(todos);
    } catch (error) {
        console.error('Error fetching todos:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const getPersonalTodos = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const { email } = decoded;

        const todosKeys = await client.keys(`todo:*`);

        const todos = [];

        for (const key of todosKeys) {
            const todoData = await client.get(key);
            const todo = JSON.parse(todoData);

            if (todo.assigned_to === email) {
                todos.push(todo);
            }
        }

        res.json(todos);
    } catch (error) {
        console.error('Error fetching todos:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const getCreatedTodos = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const { email } = decoded;

        const todosKeys = await client.keys(`todo:*`);

        const todos = [];

        for (const key of todosKeys) {
            const todoData = await client.get(key);
            const todo = JSON.parse(todoData);

            if (todo.createdBy === email) {
                todos.push(todo);
            }
        }

        res.json(todos);
    } catch (error) {
        console.error('Error fetching todos:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const getEmployees = async (req, res) => {
    const keys = await client.keys(`user:email:*`);

    const users = [];

    const token = req.headers.authorization.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    const { email } = decoded;

    for (const key of keys) {
        const userData = await client.get(key);
        const user = JSON.parse(userData);

        if (user.manager === email) {
            users.push(user);
        }
    }

    res.json(users);
}

const completeTodo = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    const keys = await client.keys(`todo:*`);

    for (const key of keys) {
        const todoData = await client.get(key);
        const todo = JSON.parse(todoData);
        if (todo.id === req.params.id) {
            todo.is_completed = true;
            client.set(key, JSON.stringify(todo));
            return res.json({ success: true, message: 'Todo is completed successfully' });
        }
    }
    return res.status(401).json({ error: 'Todo not found' });
}

const inCompleteTodo = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    const keys = await client.keys(`todo:*`);

    for (const key of keys) {
        const todoData = await client.get(key);
        const todo = JSON.parse(todoData);
        if (todo.id === req.params.id) {
            todo.is_completed = false;
            client.set(key, JSON.stringify(todo));
            return res.json({ success: true, message: 'Todo is_completed changed successfully' });
        }
    }
    return res.status(401).json({ error: 'Todo not found' });
}

const createComment = async (req, res) => {
    const {
        todo_id,
        comment,
    } = req.body;

    const token = req.headers.authorization.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    await client.set(`comments:${uuidv4()}:${todo_id}`, JSON.stringify({
        todo_id,
        comment,
    }));

    res.json({ success: true, message: 'comment created successfully' });
}

const getAllCommentsForTodo = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id);
        const commentsKeys = await client.keys(`comments:*:${id}`);

        const comments = await Promise.all(
            commentsKeys.map(async (key) => {
                const commentData = await client.get(key);
                return JSON.parse(commentData);
            })
        );

        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const changeAssignedToById = async (req, res) => {
    try {
        const { id, new_assigned_to, fullName } = req.body;
        console.log(id, new_assigned_to, fullName, "data changed");
        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const todosKeys = await client.keys(`todo:*`);

        for (const key of todosKeys) {
            const todoData = await client.get(key);
            const todo = JSON.parse(todoData);
            if (todo.id === id) {
                todo.assigned_to = new_assigned_to;
                todo.fullName = fullName;
                client.set(key, JSON.stringify(todo));
                return res.json({ success: true, message: 'Assigned_to updated successfully' });
            }
        }

    } catch (error) {
        console.error('Error changing assigned_to by id:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, "645g6s5r4g65trg94trs6g4sr1t5gh456wretgh61stbg1tr665gh4rt6gbh56");
        return decoded;
    } catch (error) {
        console.error('Error verifying token:', error.message);
        return null;
    }
};
export {
    signup,
    login,
    getManager,
    createTodo,
    getEmployees,
    getAllTodos,
    getPersonalTodos,
    completeTodo,
    inCompleteTodo,
    createComment,
    getAllCommentsForTodo,
    changeAssignedToById,
    getCreatedTodos
};
