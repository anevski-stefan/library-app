import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class BookRequest extends Model {
  public id!: string;
  public user_id!: string;
  public title!: string;
  public author!: string;
  public external_link?: string;
  public status!: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  public admin_comment?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

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
        model: 'users',
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
      type: DataTypes.ENUM('pending', 'in_progress', 'approved', 'rejected', 'completed'),
      defaultValue: 'pending',
    },
    admin_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'BookRequest',
    tableName: 'book_requests',
    underscored: true,
  }
);

export default BookRequest; 