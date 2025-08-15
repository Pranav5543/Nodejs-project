// File: controllers/userController.js

const db = require('../database/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Utility function to check for missing required keys in a request body.
 * @param {object} body - The request body object.
 * @param {Array<string>} requiredKeys - An array of required key names.
 * @returns {Array<string>} - An array of missing key names.
 */
const checkMissingKeys = (body, requiredKeys) => {
    return requiredKeys.filter(key => !(key in body));
};

/**
 * Validates a user's details for creation and formats data.
 * @param {string} full_name - The user's full name.
 * @param {string} mob_num - The user's mobile number.
 * @param {string} pan_num - The user's PAN number.
 * @returns {{isValid: boolean, message: string, mob_num?: string, pan_num?: string}}
 */
const validateUser = (full_name, mob_num, pan_num) => {
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
        return { isValid: false, message: 'Full name must not be empty.' };
    }
    const formattedMobNum = mob_num.replace(/\D/g, '').slice(-10);
    if (formattedMobNum.length !== 10) {
        return { isValid: false, message: 'Mobile number must be a valid 10-digit number.' };
    }
    const formattedPanNum = pan_num.toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formattedPanNum)) {
        return { isValid: false, message: 'PAN number is not a valid format.' };
    }
    return {
        isValid: true,
        message: 'Validation successful.',
        mob_num: formattedMobNum,
        pan_num: formattedPanNum
    };
};

/**
 * Validates update data for user updates.
 * @param {object} updateData - Object containing fields to update.
 * @returns {{isValid: boolean, message: string, validatedData?: object}}
 */
const validateUpdate = (updateData) => {
    const validatedData = {};
    const validKeys = ['full_name', 'mob_num', 'pan_num', 'manager_id'];
    for (const key in updateData) {
        if (!validKeys.includes(key)) {
            return { isValid: false, message: `Invalid key for update: ${key}.` };
        }
        switch (key) {
            case 'full_name':
                if (typeof updateData.full_name !== 'string' || updateData.full_name.trim().length === 0) {
                    return { isValid: false, message: 'Full name must not be empty.' };
                }
                validatedData.full_name = updateData.full_name;
                break;
            case 'mob_num':
                const formattedMobNum = updateData.mob_num.replace(/\D/g, '').slice(-10);
                if (formattedMobNum.length !== 10) {
                    return { isValid: false, message: 'Mobile number must be a valid 10-digit number.' };
                }
                validatedData.mob_num = formattedMobNum;
                break;
            case 'pan_num':
                const formattedPanNum = updateData.pan_num.toUpperCase();
                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                if (!panRegex.test(formattedPanNum)) {
                    return { isValid: false, message: 'PAN number is not a valid format.' };
                }
                validatedData.pan_num = formattedPanNum;
                break;
            case 'manager_id':
                validatedData.manager_id = updateData.manager_id;
                break;
        }
    }
    if (Object.keys(validatedData).length === 0) {
        return { isValid: false, message: 'No valid fields provided for update.' };
    }
    return { isValid: true, message: 'Validation successful.', validatedData: validatedData };
};

exports.createUser = (req, res) => {
    const requiredKeys = ['full_name', 'mob_num', 'pan_num', 'manager_id'];
    const missingKeys = checkMissingKeys(req.body, requiredKeys);
    if (missingKeys.length > 0) {
        return res.status(400).json({ status: 'error', message: `Missing required keys: ${missingKeys.join(', ')}` });
    }
    const { full_name, mob_num, pan_num, manager_id } = req.body;
    const validationResult = validateUser(full_name, mob_num, pan_num);
    if (!validationResult.isValid) {
        return res.status(400).json({ status: 'error', message: validationResult.message });
    }
    db.get('SELECT is_active FROM managers WHERE manager_id = ?', [manager_id], (err, row) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Internal server error.' });
        }
        if (!row || !row.is_active) {
            return res.status(400).json({ status: 'error', message: `Manager with ID ${manager_id} is not active or does not exist.` });
        }
        const user_id = uuidv4();
        const now = new Date().toISOString();
        const stmt = db.prepare(`
            INSERT INTO users (user_id, full_name, mob_num, pan_num, manager_id, created_at, updated_at, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(user_id, full_name, validationResult.mob_num, validationResult.pan_num, manager_id, now, now, 1, function(err) {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Internal server error.' });
            }
            res.status(201).json({ status: 'success', message: 'User created successfully.', user_id: user_id });
        });
        stmt.finalize();
    });
};

exports.getUsers = (req, res) => {
    const { user_id, mob_num, manager_id } = req.body;
    let sql = 'SELECT * FROM users WHERE is_active = 1';
    const params = [];
    const conditions = [];
    if (user_id) {
        conditions.push('user_id = ?');
        params.push(user_id);
    }
    if (mob_num) {
        const formattedMobNum = mob_num.replace(/\D/g, '').slice(-10);
        conditions.push('mob_num LIKE ?');
        params.push(`%${formattedMobNum}`);
    }
    if (manager_id) {
        conditions.push('manager_id = ?');
        params.push(manager_id);
    }
    if (conditions.length > 0) {
        sql += ' AND ' + conditions.join(' AND ');
    }
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Internal server error.' });
        }
        res.status(200).json({ status: 'success', users: rows });
    });
};

exports.deleteUser = (req, res) => {
    if (!req.body.user_id && !req.body.mob_num) {
        return res.status(400).json({ status: 'error', message: 'Missing required keys: user_id or mob_num.' });
    }
    const { user_id, mob_num } = req.body;
    let sql = 'DELETE FROM users WHERE ';
    const params = [];
    if (user_id) {
        sql += 'user_id = ?';
        params.push(user_id);
    } else if (mob_num) {
        const formattedMobNum = mob_num.replace(/\D/g, '').slice(-10);
        sql += 'mob_num = ?';
        params.push(formattedMobNum);
    }
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Internal server error.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }
        res.status(200).json({ status: 'success', message: 'User deleted successfully.' });
    });
};

exports.updateUser = (req, res) => {
    const { user_ids, update_data } = req.body;
    const requiredKeys = ['user_ids', 'update_data'];
    const missingKeys = checkMissingKeys(req.body, requiredKeys);
    if (missingKeys.length > 0) {
        return res.status(400).json({ status: 'error', message: `Missing required keys: ${missingKeys.join(', ')}` });
    }
    const validUpdateKeys = ['full_name', 'mob_num', 'pan_num', 'manager_id'];
    const invalidKeys = Object.keys(update_data).filter(key => !validUpdateKeys.includes(key));
    if (invalidKeys.length > 0) {
        return res.status(400).json({ status: 'error', message: `Invalid keys in update_data: ${invalidKeys.join(', ')}` });
    }
    const validationResult = validateUpdate(update_data);
    if (!validationResult.isValid) {
        return res.status(400).json({ status: 'error', message: validationResult.message });
    }
    if (Object.keys(update_data).length === 1 && update_data.manager_id && user_ids.length > 1) {
        const { manager_id } = update_data;
        db.get('SELECT is_active FROM managers WHERE manager_id = ?', [manager_id], (err, row) => {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Internal server error.' });
            }
            if (!row || !row.is_active) {
                return res.status(400).json({ status: 'error', message: `Manager with ID ${manager_id} is not active or does not exist.` });
            }
            const placeholders = user_ids.map(() => '?').join(', ');
            const sql = `UPDATE users SET manager_id = ?, updated_at = ? WHERE user_id IN (${placeholders})`;
            const params = [manager_id, new Date().toISOString(), ...user_ids];
            db.run(sql, params, function(err) {
                if (err) {
                    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
                }
                res.status(200).json({ status: 'success', message: `Bulk update successful for ${this.changes} user(s).` });
            });
        });
    } else {
        if (user_ids.length > 1) {
            return res.status(400).json({ status: 'error', message: 'Individual updates can only be performed on a single user.' });
        }
        const user_id = user_ids[0];
        const updateParams = [];
        const updateFields = [];
        if (update_data.manager_id) {
            const newManagerId = update_data.manager_id;
            db.get('SELECT is_active FROM managers WHERE manager_id = ?', [newManagerId], (err, row) => {
                if (err) {
                    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
                }
                if (!row || !row.is_active) {
                    return res.status(400).json({ status: 'error', message: `Manager with ID ${newManagerId} is not active or does not exist.` });
                }
                db.get('SELECT * FROM users WHERE user_id = ? AND is_active = 1', [user_id], (err, user) => {
                    if (err) {
                        return res.status(500).json({ status: 'error', message: 'Internal server error.' });
                    }
                    if (!user) {
                        return res.status(404).json({ status: 'error', message: 'User not found or is inactive.' });
                    }
                    db.serialize(() => {
                        db.run('UPDATE users SET is_active = 0, updated_at = ? WHERE user_id = ?', [new Date().toISOString(), user_id], (err) => {
                            if (err) {
                                return res.status(500).json({ status: 'error', message: 'Internal server error.' });
                            }
                        });
                        const newUser_id = uuidv4();
                        const now = new Date().toISOString();
                        db.run(`
                            INSERT INTO users (user_id, full_name, mob_num, pan_num, manager_id, created_at, updated_at, is_active)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `, [newUser_id, user.full_name, user.mob_num, user.pan_num, newManagerId, now, now, 1], (err) => {
                            if (err) {
                                return res.status(500).json({ status: 'error', message: 'Internal server error.' });
                            }
                            res.status(200).json({ status: 'success', message: 'Manager updated successfully.', new_user_id: newUser_id });
                        });
                    });
                });
            });
        } else {
            const now = new Date().toISOString();
            const validationResult = validateUpdate(update_data);
            if (!validationResult.isValid) {
                return res.status(400).json({ status: 'error', message: validationResult.message });
            }
            for (const key in validationResult.validatedData) {
                if (validationResult.validatedData.hasOwnProperty(key)) {
                    updateFields.push(`${key} = ?`);
                    updateParams.push(validationResult.validatedData[key]);
                }
            }
            if (updateFields.length === 0) {
                return res.status(400).json({ status: 'error', message: 'No valid fields to update.' });
            }
            updateFields.push('updated_at = ?');
            updateParams.push(now);
            updateParams.push(user_id);
            const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`;
            db.run(sql, updateParams, function(err) {
                if (err) {
                    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ status: 'error', message: 'User not found.' });
                }
                res.status(200).json({ status: 'success', message: 'User updated successfully.' });
            });
        }
    }
};

exports.getManagers = (req, res) => {
    const sql = 'SELECT manager_id, manager_name, is_active FROM managers';
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Internal server error.' });
        }
        res.status(200).json({ status: 'success', managers: rows });
    });
};