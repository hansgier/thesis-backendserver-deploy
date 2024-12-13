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
            },
            due_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            completion_date: {
                type: DataTypes.DATE,
                allowNull: true,
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
            // progress: {
            //     // percentage of completion of the project, ranges from 0 to 100
            //     type: DataTypes.INTEGER,
            //     allowNull: false,
            //     defaultValue: 0,
            //     validate: {
            //         min: {
            //             args: [0],
            //             msg: 'Progress cannot be negative',
            //         },
            //         max: {
            //             args: [100],
            //             msg: 'Progress must not exceed 100',
            //         },
            //         isInt: {
            //             args: true,
            //             msg: 'Progress must be an integer',
            //         },
            //     },
            // },
            funding_source: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            implementing_agency: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            contract_term: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            contractor: {
                type: DataTypes.STRING,
                allowNull: true,
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
