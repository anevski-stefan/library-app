import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export interface BookAttributes {
  id: string;
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  availableQuantity: number;
  category: string;
  barcode?: string;
}

class Book extends Model<BookAttributes> implements BookAttributes {
  public id!: string;
  public title!: string;
  public author!: string;
  public isbn!: string;
  public quantity!: number;
  public availableQuantity!: number;
  public category!: string;
  public barcode?: string;
}

Book.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isbn: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    availableQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    barcode: {
      type: DataTypes.STRING,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'books',
  }
);

export default Book; 