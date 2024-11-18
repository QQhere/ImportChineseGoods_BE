const { createCustomerService, loginCustomerService, getAllCustomerService, updateCustomerService, deleteCustomerService, changePasswordService, getCustomerByIdService, searchCustomerService } = require("../services/customerService");
const responseCodes = require('../untils/response_types');

const createCustomer = async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) return res.status(400).json(responseCodes.NOT_ENOUGH);

    const result = await createCustomerService(req.body);

    if (result) {
        console.log(result);
        return res.status(200).json(result);
    } else {
        return res.status(500).json(result);
    }
}

const handleLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json(responseCodes.NOT_ENOUGH);

    const result = await loginCustomerService(req.body);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json(result);
    }
}

const getAllCustomer = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await getAllCustomerService(page, pageSize);

    if (result) {
        return res.status(200).json({
            data: result.rows,
            pagination: {
                total: result.count || 0,
                current: page,
                pageSize: pageSize,
            },
        });
    } else {
        return res.status(500).json(result);
    }
};

const getCustomerById = async (req, res) => {
    const result = await getCustomerByIdService(req.params.id);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json(result);
    }
}

const updateCustomer = async (req, res) => {
    const result = await updateCustomerService(req.params.id, req.body);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json(result);
    }
}

const deleteCustomer = async (req, res) => {
    const result = await deleteCustomerService(req.params.id);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json(result);
    }
}

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json(responseCodes.NOT_ENOUGH);

    const result = await changePasswordService(req.params.id, req.body);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json(result);
    }
}

const searchCustomer = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await searchCustomerService(req.params.keyword, page, pageSize);

    if (result) {
        return res.status(200).json({
            data: result.rows,
            pagination: {
                total: result.count || 0,
                current: page,
                pageSize: pageSize,
            },
        });
    } else {
        return res.status(500).json(result);
    }
}
module.exports = {
    createCustomer,
    handleLogin,
    getAllCustomer,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    changePassword,
    searchCustomer
}