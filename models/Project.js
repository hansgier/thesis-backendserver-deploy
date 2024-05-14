const { STATUS } = require('../utils');
const { Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    const Project = sequelize.define('project', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: {
                        args: true,
                        msg: 'Please provide a title',
                    },
                    max: {
                        args: [50],
                        msg: 'Title must be at most 50 characters',
                    },
                    isString(value) {
                        if (typeof value !== 'string') {
                            throw new Error('Title must be a string');
                        }
                    },
                    isUnique(value) {
                        return Project.findOne({ where: { title: value } }).then(project => {
                            if (project) {
                                throw new Error('Title already exists');
                            }
                        });
                    },
                },
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
                validate: {
                    isText(value) {
                        if (typeof value !== 'string') {
                            throw new Error('Description must be a text');
                        }
                    },
                },
            },
            cost: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: true,
                validate: {
                    min: {
                        args: [0],
                        msg: 'Cost cannot be negative',
                    },
                    isDecimal: {
                        args: true,
                    },
                },
            },
            start_date: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: true,
                validate: {
                    isDate: {
                        args: true,
                        msg: 'Start date must be a valid date',
                    },
                    beforeDueDate(value) {
                        if (!value) {
                            return;
                        } else if (this.due_date && value >= this.due_date) {
                            throw new Error('Start date must be before due date');
                        }
                    },
                },
            },
            due_date: {
                type: DataTypes.DATE,
                allowNull: true,
                validate: {
                    isDate: {
                        args: true,
                        msg: 'Due date must be a valid date',
                    },
                    afterStartDate(value) {
                        if (!value) {
                            return;
                        } else if (this.start_date && value <= this.start_date) {
                            throw new Error('Due date must be after start date');
                        }
                    },
                },
            },
            completion_date: {
                type: DataTypes.DATE,
                allowNull: true,
                validate: {
                    isDate: {
                        args: true,
                        msg: 'Completion date must be a valid date',
                    },
                    afterStartDate(value) {
                        if (!value) {
                            return;
                        } else if (this.start_date && value < this.start_date) {
                            throw new Error('Completion date must not be before start date');
                        }
                    },
                },
            },
            status: {
                type: DataTypes.ENUM(...STATUS),
                allowNull: false,
                defaultValue: STATUS[0],
                validate: {
                    isIn: {
                        args: [STATUS],
                        msg: `Status must be one of the following: ${ STATUS }`,
                    },
                },
            },
            progress: {
                // percentage of completion of the project, ranges from 0 to 100
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: {
                        args: [0],
                        msg: 'Progress cannot be negative',
                    },
                    max: {
                        args: [100],
                        msg: 'Progress must not exceed 100',
                    },
                    isInt: {
                        args: true,
                        msg: 'Progress must be an integer',
                    },
                },
            },
            funding_source: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            views: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: {
                        args: [0],
                        msg: 'Views cannot be negative',
                    },
                    isInt: {
                        args: true,
                        msg: 'Views must be an integer',
                    },
                },
            },
        },
        {
            timestamps: true,
        },
    );

    Project.beforeUpdate(async (project) => {
        if (project.status === 'completed' || project.progress === 100) {
            project.status = project.progress === 100 ? 'completed' : project.status;
        } else {
            project.completion_date = null;
        }
    });

    return Project;
};
