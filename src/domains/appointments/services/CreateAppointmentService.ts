import { injectable, inject } from 'tsyringe';
import { startOfHour, isAfter, getHours } from 'date-fns';

import Appointment, {
  AppointmentType,
} from '@domains/appointments/infra/database/entities/Appointment';
import AppError from '@shared/errors/AppError';
import IAppointmentsRepository from '@domains/appointments/interfaces/IAppointmentsRepository';
import {
  BUSINESS_LIMIT_HOUR,
  BUSINESS_START_HOUR,
} from '@domains/users/constants/appointments';

interface IRequest {
  provider_id: string;
  customer_id: string;
  date: Date;
  type: AppointmentType;
}

@injectable()
class CreateAppointmentService {
  constructor(
    @inject('AppointmentsRepository')
    private appointmentsRepository: IAppointmentsRepository,
  ) {}

  public async execute({
    provider_id,
    customer_id,
    date,
    type,
  }: IRequest): Promise<Appointment> {
    const appointmentDate = startOfHour(date);

    const appointmentInTheSameDate = await this.appointmentsRepository.findByDate(
      appointmentDate,
    );

    if (appointmentInTheSameDate) {
      throw new AppError("There's already a appointment booked in that date");
    }

    const customerIsTheProvider = provider_id === customer_id;

    if (customerIsTheProvider) {
      throw new AppError("You can't book an appointment with yourself");
    }

    const hasValidDate = isAfter(appointmentDate, new Date(Date.now()));

    if (!hasValidDate) {
      throw new AppError("You can't book an appointment in a past date");
    }

    const appointmentHours = getHours(appointmentDate);
    const isInBussinessHoursRange =
      appointmentHours >= BUSINESS_START_HOUR &&
      appointmentHours <= BUSINESS_LIMIT_HOUR;

    if (!isInBussinessHoursRange) {
      throw new AppError(
        "You can't book an appointment in a hour outside the business hours range",
      );
    }

    const appointment = this.appointmentsRepository.create({
      provider_id,
      customer_id,
      date: appointmentDate,
      type,
    });

    return appointment;
  }
}

export default CreateAppointmentService;
