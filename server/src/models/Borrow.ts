import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import Book from './Book';

export interface BorrowAttributes {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: Date;
  returnDate: Date;
  actualReturnDate?: Date;
  status: 'borrowed' | 'returned' | 'overdue';
}

interface BorrowCreationAttributes extends Omit<BorrowAttributes, 'id' | 'borrowDate'> {
  id?: string;
  borrowDate?: Date;
}

class Borrow extends Model<BorrowAttributes, BorrowCreationAttributes> implements BorrowAttributes {
  public id!: string;
  public userId!: string;
  public bookId!: string;
  public borrowDate!: Date;
  public returnDate!: Date;
  public actualReturnDate?: Date;
  public status!: 'borrowed' | 'returned' | 'overdue';
}

Borrow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    bookId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    borrowDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    returnDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    actualReturnDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('borrowed', 'returned', 'overdue'),
      allowNull: false,
      defaultValue: 'borrowed',
    },
  },
  {
    sequelize,
    tableName: 'borrows',
    underscored: true,
  }
);

Borrow.belongsTo(Book, {
  foreignKey: 'bookId',
  as: 'book'
});

export default Borrow; 