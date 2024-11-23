import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

export interface BookRequestAttributes {
  id: string;
  user_id: string;
  title: string;
  author: string;
  external_link?: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  admin_comment?: string;
  user?: User;
}

interface BookRequestCreationAttributes extends Omit<BookRequestAttributes, 'id'> {}

class BookRequest extends Model<BookRequestAttributes, BookRequestCreationAttributes> implements BookRequestAttributes {
  public id!: string;
  public user_id!: string;
  public title!: string;
  public author!: string;
  public external_link!: string;
  public status!: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  public admin_comment!: string;
  public user?: User;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    BookRequest.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }
}

BookRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
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
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    external_link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    admin_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'book_requests',
    underscored: true,
  }
);

export default BookRequest; 