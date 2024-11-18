require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/sequelize');
const Customer = require('../models/customer')(sequelize);
const responseCodes = require('../untils/response_types');
const { Op } = require('sequelize');

const saltRounds = 10;

const createCustomerService = async (data) => {
    try {
        const lastCustomer = await Customer.findOne({
            order: [['id', 'DESC']],
            attributes: ['id'],
        });

        let newId = 'A0001';

        if (lastCustomer) {
            const lastId = lastCustomer.id;
            const prefix = lastId[0];
            const number = parseInt(lastId.slice(1));

            if (number < 9999) {
                const nextNumber = number + 1;
                newId = `${prefix}${String(nextNumber).padStart(4, '0')}`;
            } else {
                const nextPrefix = String.fromCharCode(prefix.charCodeAt(0) + 1);
                newId = `${nextPrefix}0001`;
            }
        }

        const customer = await Customer.findOne({ where: { email: data.email } });
        if (customer) {
            return responseCodes.EMAIL_EXISTS;
        }

        const customerPhone = await Customer.findOne({ where: { phone: data.phone } });
        if (customerPhone) {
            return responseCodes.PHONE_EXISTS;
        }

        const hashPassword = await bcrypt.hash(data.password, saltRounds);

        const result = await Customer.create({
            id: newId,
            name: data.name,
            email: data.email,
            password: hashPassword,
            phone: data.phone,
        });

        return {
            ...responseCodes.REGISTER_SUCCESS,
            customer: result,
        };
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const loginCustomerService = async (data) => {
    try {
        // fetch user by email
        const customer = await Customer.findOne({ where: { email: data.email } });
        if (customer) {
            //compare password
            const match = await bcrypt.compare(data.password, customer.password);
            if (!match) {
                return responseCodes.INVALID_CREDENTIALS;
            }
            else {
                //create access token
                const payload = {
                    id: customer.id,
                    email: customer.email,
                    name: customer.name,
                    role: 'customer',
                }

                const access_token = jwt.sign(payload, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRE,
                });
                return {
                    ...responseCodes.LOGIN_SUCCESS,
                    access_token,
                    user: {
                        id: customer.id,
                        name: customer.name,
                        email: customer.email,
                    }
                }
            }
        } else {
            return responseCodes.INVALID_CREDENTIALS;
        }

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getAllCustomerService = async (page, pageSize) => { 
    try {
        const offset = (page - 1) * pageSize;
        const result = await Customer.findAndCountAll({
            attributes: { exclude: ['password'] },
            offset: offset,
            limit: pageSize,
            where: {
                is_active: true
            }
        });

        return result;
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const updateCustomerService = async (id, data) => {
    try {
        const customer = await Customer.findOne({ where: { id } });
        if (!customer) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        if (data.email && data.email !== customer.email) {
            const emailExists = await Customer.findOne({ where: { email: data.email } });
            if (emailExists) {
                return responseCodes.EMAIL_EXISTS;
            }
        }

        if (data.phone && data.phone !== customer.phone) {
            const phoneExists = await Customer.findOne({ where: { phone: data.phone } });
            if (phoneExists) {
                return responseCodes.PHONE_EXISTS;
            }
        }

        if (data.password) {
            return responseCodes.UNPROFITABLE;
        }

        await customer.update(data);
        return {
            ...responseCodes.UPDATE_SUCCESS,
            customer
        };

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const deleteCustomerService = async (id) => {
    try {
        const customer = await Customer.findOne({ where: { id } });
        if (!customer) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        await customer.update({
            is_active: false
        });
        return responseCodes.DELETE_SUCCESS;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const getCustomerByIdService = async (id) => {
    try {
        const customer = await Customer.findOne({ where: { id } });
        if (!customer) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }
        return customer;
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const searchCustomerService = async (keyword, page, pageSize) => {
    try {
        const offset = (page - 1) * pageSize;
        const result = await Customer.findAndCountAll({
            offset: offset,
            limit: pageSize,
            where: {
                [Op.or]: [
                    { email: { [Op.like]: `%${keyword}%` } },
                    { phone: { [Op.like]: `%${keyword}%` } },
                ]
            }
        });
        return result;
    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

const changePasswordService = async (id, data) => {
    try {
        const customer = await Customer.findOne({ where: { id } });
        if (!customer) {
            return responseCodes.ACCOUNT_NOT_FOUND;
        }

        const match = await bcrypt.compare(data.oldPassword, customer.password);
        if (!match) {
            return responseCodes.NO_MATCH_PASSWORD;
        }

        const hashPassword = await bcrypt.hash(data.newPassword, saltRounds);
        await customer.update({
            password: hashPassword
        });
        return responseCodes.CHANGE_PASSWORD_SUCCESS;

    } catch (error) {
        console.log(error);
        return responseCodes.SERVER_ERROR;
    }
};

module.exports = {
    createCustomerService,
    loginCustomerService,
    getAllCustomerService,
    updateCustomerService,
    deleteCustomerService,
    getCustomerByIdService,
    searchCustomerService,
    changePasswordService
}