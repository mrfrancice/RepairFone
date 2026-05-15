import { Injectable, BadRequestException } from '@nestjs/common';
import { Readable } from 'stream';
import PDFDocument from 'pdfkit';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
} from './entities/payment.entity';

/**
 * Génère un reçu PDF à partir d'un Payment complété.
 *
 * Stratégie : pdfkit programmatique (pas de template HTML, pas de chromium).
 * Avantages : léger (~3 MB), démarrage instantané, déterministe.
 * Limites : layout en code TypeScript (à porter sur Puppeteer si templates riches).
 */
@Injectable()
export class ReceiptService {
  generate(payment: Payment): Readable {
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Reçu disponible uniquement pour les paiements complétés.',
      );
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Reçu RepairFone ${payment.paymentNumber ?? payment.id}`,
        Author: 'RepairFone',
        Creator: 'RepairFone API',
      },
    });

    // ===== Header =====
    doc
      .fontSize(20)
      .fillColor('#FF9800')
      .text('RepairFone', 50, 50, { continued: false })
      .fontSize(10)
      .fillColor('#666')
      .text('Plateforme de réparation mobile et informatique', 50, 75)
      .text("Côte d'Ivoire", 50, 89);

    doc
      .fontSize(18)
      .fillColor('#1A1A1A')
      .text('REÇU DE PAIEMENT', 350, 50, { align: 'right' })
      .fontSize(10)
      .fillColor('#666')
      .text(`N° ${payment.paymentNumber ?? payment.id}`, 350, 75, {
        align: 'right',
      })
      .text(this.formatDate(payment.paidAt ?? payment.createdAt), 350, 89, {
        align: 'right',
      });

    // Trait de séparation
    doc
      .moveTo(50, 120)
      .lineTo(550, 120)
      .strokeColor('#FF9800')
      .lineWidth(2)
      .stroke();

    // ===== Statut =====
    doc
      .roundedRect(50, 140, 100, 26, 4)
      .fillColor('#E8F5E9')
      .fill()
      .fillColor('#2E7D32')
      .fontSize(11)
      .text('PAYÉ', 50, 147, { width: 100, align: 'center' });

    // ===== Détails parties =====
    let y = 200;
    doc
      .fillColor('#1A1A1A')
      .fontSize(12)
      .text('Client', 50, y)
      .text('Réparateur', 300, y);

    y += 18;
    const repairerUser = payment.repairer?.user;
    const repairerName =
      payment.repairer?.businessName || this.fullName(repairerUser);
    doc
      .fontSize(10)
      .fillColor('#444')
      .text(this.fullName(payment.client), 50, y)
      .text(repairerName, 300, y);

    if (payment.client?.phone) {
      y += 14;
      doc.text(payment.client.phone, 50, y);
      if (repairerUser?.phone) doc.text(repairerUser.phone, 300, y);
    }

    // ===== Appareil + service =====
    y += 50;
    doc
      .fontSize(12)
      .fillColor('#1A1A1A')
      .text('Détails de la réparation', 50, y);

    y += 22;
    if (payment.request?.device) {
      doc
        .fontSize(10)
        .fillColor('#444')
        .text(
          `Appareil : ${payment.request.device.brand} ${payment.request.device.model}`,
          50,
          y,
        );
      y += 14;
    }
    if (payment.request?.serviceType) {
      doc.text(`Service : ${payment.request.serviceType.name}`, 50, y);
      y += 14;
    }
    doc.text(
      `Type de paiement : ${this.paymentTypeLabel(payment.paymentType)}`,
      50,
      y,
    );

    // ===== Montants =====
    y += 50;
    doc.roundedRect(50, y, 500, 100, 6).fillColor('#FAFAFA').fill();

    doc
      .fillColor('#1A1A1A')
      .fontSize(11)
      .text('Montant', 70, y + 18)
      .text(this.formatAmount(payment.amount), 470, y + 18, {
        width: 60,
        align: 'right',
      });

    if (payment.platformFee) {
      doc
        .fillColor('#666')
        .fontSize(10)
        .text('Frais plateforme', 70, y + 40)
        .text(`-${this.formatAmount(payment.platformFee)}`, 470, y + 40, {
          width: 60,
          align: 'right',
        });
    }

    if (payment.repairerAmount) {
      doc
        .fillColor('#1A1A1A')
        .fontSize(12)
        .text('Net réparateur', 70, y + 65)
        .fillColor('#FF9800')
        .text(this.formatAmount(payment.repairerAmount), 470, y + 65, {
          width: 60,
          align: 'right',
        });
    }

    // ===== Méthode + référence =====
    y += 130;
    doc
      .fontSize(11)
      .fillColor('#1A1A1A')
      .text(
        `Mode de paiement : ${this.paymentMethodLabel(payment.paymentMethod)}`,
        50,
        y,
      );
    if (payment.transactionRef) {
      y += 16;
      doc
        .fontSize(10)
        .fillColor('#666')
        .text(`Référence transaction : ${payment.transactionRef}`, 50, y);
    }

    // ===== Footer =====
    doc
      .fontSize(8)
      .fillColor('#999')
      .text(
        'Ce reçu fait foi de la transaction effectuée sur la plateforme RepairFone. ' +
          'Pour toute réclamation, contactez support@repairfone.ci',
        50,
        780,
        { width: 500, align: 'center' },
      );

    doc.end();
    return doc as Readable;
  }

  // ===== Helpers de formatage =====

  private formatAmount(amount?: number | string | null): string {
    if (amount == null) return '0 FCFA';
    const n = typeof amount === 'string' ? Number(amount) : amount;
    return `${n.toLocaleString('fr-FR')} FCFA`;
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private fullName(
    person: { firstName?: string; lastName?: string } | null | undefined,
  ): string {
    if (!person) return '—';
    return [person.firstName, person.lastName].filter(Boolean).join(' ') || '—';
  }

  private paymentMethodLabel(method?: PaymentMethod | null): string {
    const labels: Partial<Record<PaymentMethod, string>> = {
      [PaymentMethod.ORANGE_MONEY]: 'Orange Money',
      [PaymentMethod.MTN_MONEY]: 'MTN Money',
      [PaymentMethod.WAVE]: 'Wave',
      [PaymentMethod.CASH]: 'Espèces',
      [PaymentMethod.CARD]: 'Carte bancaire',
    };
    return method ? (labels[method] ?? String(method)) : '—';
  }

  private paymentTypeLabel(type?: PaymentType | null): string {
    const labels: Partial<Record<PaymentType, string>> = {
      [PaymentType.DEPOSIT]: 'Acompte',
      [PaymentType.BALANCE]: 'Solde',
      [PaymentType.FULL]: 'Paiement intégral',
      [PaymentType.REFUND]: 'Remboursement',
    };
    return type ? (labels[type] ?? String(type)) : '—';
  }
}
