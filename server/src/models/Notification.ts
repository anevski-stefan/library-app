import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

export interface NotificationAttributes {
  id: string;
  userId: string;
  message: string;
  type: 'overdue' | 'reminder' | 'return';
  read: boolean;
  borrowId?: string;
}

export interface NotificationCreationAttributes extends Omit<NotificationAttributes, 'id' | 'read'> {
  id?: string;
  read?: boolean;
}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: string;
  public userId!: string;
  public message!: string;
  public type!: 'overdue' | 'reminder' | 'return';
  public read!: boolean;
  public borrowId?: string;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('overdue', 'reminder', 'return'),
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    borrowId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    underscored: true,
  }
);

export default Notification; 