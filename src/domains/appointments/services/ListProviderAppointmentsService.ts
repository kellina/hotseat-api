import { inject, injectable } from 'tsyringe';
import { isBefore } from 'date-fns';

import IAppointmentsRepository from '@domains/appointments/interfaces/IAppointmentsRepository';
import Appointment from '@domains/appointments/infra/database/entities/Appointment';

interface IRequest {
  day: number;
  year: number;
  month: number;
  provider_id: string;
}

interface IResponse extends Appointment {
  isPast: boolean;
}

@injectable()
class ListProviderAppointmentsService {
  constructor(
    @inject('AppointmentsRepository')
    private appointmentsRepository: IAppointmentsRepository,
  ) {}

  async execute({
    day,
    year,
    month,
    provider_id,
  }: IRequest): Promise<IResponse[]> {
    const appointments = await this.appointmentsRepository.findByDayFromProvider(
      {
        day,
        year,
        month,
        provider_id,
      },
    );

    const listAppointments = appointments.map(appointment => {
      const currentDate = new Date(Date.now());

      return {
        ...appointment,
        isPast: isBefore(appointment.date, currentDate),
      };
    });

    return listAppointments;
  }
}

export default ListProviderAppointmentsService;