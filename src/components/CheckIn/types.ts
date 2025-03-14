export interface InterfaceUser {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface InterfaceAttendeeCheckIn {
  _id: string;
  user: InterfaceUser;
  checkIn: null | {
    _id: string;
    time: string;
  };
}

export interface InterfaceAttendeeQueryResponse {
  event: {
    _id: string;
    attendeesCheckInStatus: InterfaceAttendeeCheckIn[];
  };
}

export interface InterfaceModalProp {
  show: boolean;
  eventId: string;
  handleClose: () => void;
}

export interface InterfaceTableCheckIn {
  id: string;
  name: string;
  userId: string;
  checkIn: null | {
    _id: string;
    time: string;
  };
  eventId: string;
}

export interface InterfaceTableData {
  userName: string;
  id: string;
  checkInData: InterfaceTableCheckIn;
}
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'superAdmin',
}

export type VerifyRoleResponse = {
  verifyRole: {
    isAuthorized: boolean;
    role: UserRole;
  };
};
