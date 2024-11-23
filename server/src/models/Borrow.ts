import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';
import Book from './Book';

export interface BorrowAttributes {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: Date;
  returnDate: Date;
  actualReturnDate?: Date | null;
  notificationSent: boolean;
  reminderSent: boolean;
  user?: User;
  book?: Book;
}

export interface BorrowCreationAttributes extends Omit<BorrowAttributes, 'id'> {
  id?: string;
}

class Borrow extends Model<BorrowAttributes, BorrowCreationAttributes> implements BorrowAttributes {
  public id!: string;
  public userId!: string;
  public bookId!: string;
  public borrowDate!: Date;
  public returnDate!: Date;
  public actualReturnDate!: Date | null;
  public notificationSent!: boolean;
  public reminderSent!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public user?: User;
  public book?: Book;
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
      references: {
        model: User,
        key: 'id',
      },
    },
    bookId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Book,
        key: 'id',
      },
    },
    borrowDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    returnDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    actualReturnDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notificationSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    reminderSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
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

Book.hasMany(Borrow, {
  foreignKey: 'bookId',
  as: 'borrows'
});

export default Borrow; 