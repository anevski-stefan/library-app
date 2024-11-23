import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';
import Borrow from './Borrow';
import BookRequest from './BookRequest';

export interface NotificationAttributes {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'overdue' | 'reminder' | 'return' | 'book_request' | 'request_approved' | 'request_rejected';
  read: boolean;
  borrowId?: string | null;
  bookRequestId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationCreationAttributes extends Omit<NotificationAttributes, 'id' | 'read'> {
  id?: string;
  read?: boolean;
}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: string;
  public userId!: string;
  public title!: string;
  public message!: string;
  public type!: 'overdue' | 'reminder' | 'return' | 'book_request' | 'request_approved' | 'request_rejected';
  public read!: boolean;
  public borrowId!: string | null;
  public bookRequestId!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'overdue', 
        'reminder', 
        'return', 
        'book_request', 
        'request_approved', 
        'request_rejected'
      ),
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    borrowId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Borrow,
        key: 'id',
      },
      field: 'borrow_id'
    },
    bookRequestId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: BookRequest,
        key: 'id',
      },
      field: 'book_request_id'
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['read']
      }
    ]
  }
);

Notification.belongsTo(Borrow, {
  foreignKey: 'borrowId',
  as: 'borrow'
});

Notification.belongsTo(BookRequest, {
  foreignKey: 'bookRequestId',
  as: 'bookRequest'
});

export default Notification; 