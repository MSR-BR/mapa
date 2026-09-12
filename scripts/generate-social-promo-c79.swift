import AppKit
@preconcurrency import AVFoundation
import CoreImage
import CoreMedia
import CoreVideo
import Foundation
import Vision

private let canvasWidth = 1080
private let canvasHeight = 1920
private let framesPerSecond: Int32 = 30
private let videoDuration = 15.0
private let targetURL = "https://mapadapesquisa.com.br"

private enum PromoError: Error, CustomStringConvertible {
    case asset(String)
    case export(String)
    case render(String)
    case validation(String)

    var description: String {
        switch self {
        case .asset(let message), .export(let message), .render(let message), .validation(let message):
            return message
        }
    }
}

private extension CGFloat {
    func clamped(_ lower: CGFloat = 0, _ upper: CGFloat = 1) -> CGFloat {
        Swift.max(lower, Swift.min(upper, self))
    }
}

private extension Data {
    mutating func appendASCII(_ value: String) {
        append(value.data(using: .ascii)!)
    }

    mutating func appendLittleEndian<T: FixedWidthInteger>(_ value: T) {
        var littleEndian = value.littleEndian
        Swift.withUnsafeBytes(of: &littleEndian) { append(contentsOf: $0) }
    }
}

private func smoothstep(_ value: CGFloat) -> CGFloat {
    let x = value.clamped()
    return x * x * (3 - 2 * x)
}

private func easeOutCubic(_ value: CGFloat) -> CGFloat {
    let x = value.clamped()
    return 1 - pow(1 - x, 3)
}

private func lerp(_ start: CGFloat, _ end: CGFloat, _ progress: CGFloat) -> CGFloat {
    start + (end - start) * progress
}

private func color(_ hex: UInt32, alpha: CGFloat = 1) -> NSColor {
    NSColor(
        calibratedRed: CGFloat((hex >> 16) & 0xff) / 255,
        green: CGFloat((hex >> 8) & 0xff) / 255,
        blue: CGFloat(hex & 0xff) / 255,
        alpha: alpha
    )
}

private let forest = color(0x063F34)
private let deepForest = color(0x022A24)
private let green = color(0x00A878)
private let mint = color(0xCDEFE3)
private let paper = color(0xF5F7F2)
private let amber = color(0xFFB000)
private let ink = color(0x10251F)
private let muted = color(0x5E716A)
private let electricMint = color(0x00D6A3)
private let warmPaper = color(0xFFF8E3)

private func font(_ size: CGFloat, weight: NSFont.Weight = .regular) -> NSFont {
    NSFont.systemFont(ofSize: size, weight: weight)
}

private func drawText(
    _ value: String,
    in rect: NSRect,
    size: CGFloat,
    weight: NSFont.Weight = .regular,
    color textColor: NSColor,
    alignment: NSTextAlignment = .left,
    alpha: CGFloat = 1,
    tracking: CGFloat = 0,
    lineHeight: CGFloat? = nil
) {
    guard alpha > 0.001 else { return }
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = alignment
    paragraph.lineBreakMode = .byWordWrapping
    if let lineHeight {
        paragraph.minimumLineHeight = lineHeight
        paragraph.maximumLineHeight = lineHeight
    }
    let attributes: [NSAttributedString.Key: Any] = [
        .font: font(size, weight: weight),
        .foregroundColor: textColor.withAlphaComponent(alpha),
        .paragraphStyle: paragraph,
        .kern: tracking,
    ]
    (value as NSString).draw(
        with: rect,
        options: [.usesLineFragmentOrigin, .usesFontLeading],
        attributes: attributes
    )
}

private func fillRoundedRect(_ rect: NSRect, radius: CGFloat, color fillColor: NSColor, alpha: CGFloat = 1) {
    fillColor.withAlphaComponent(alpha).setFill()
    NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius).fill()
}

private func strokeRoundedRect(_ rect: NSRect, radius: CGFloat, color strokeColor: NSColor, width: CGFloat, alpha: CGFloat = 1) {
    let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
    path.lineWidth = width
    strokeColor.withAlphaComponent(alpha).setStroke()
    path.stroke()
}

private func drawLine(from start: NSPoint, to end: NSPoint, color lineColor: NSColor, width: CGFloat, alpha: CGFloat = 1) {
    let path = NSBezierPath()
    path.move(to: start)
    path.line(to: end)
    path.lineWidth = width
    path.lineCapStyle = .round
    lineColor.withAlphaComponent(alpha).setStroke()
    path.stroke()
}

private func drawImageCover(_ image: NSImage, in rect: NSRect, zoom: CGFloat = 1, alpha: CGFloat = 1) {
    let imageSize = image.size
    let scale = max(rect.width / imageSize.width, rect.height / imageSize.height) * zoom
    let destination = NSRect(
        x: rect.midX - imageSize.width * scale / 2,
        y: rect.midY - imageSize.height * scale / 2,
        width: imageSize.width * scale,
        height: imageSize.height * scale
    )
    image.draw(
        in: destination,
        from: .zero,
        operation: .sourceOver,
        fraction: alpha,
        respectFlipped: true,
        hints: [.interpolation: NSImageInterpolation.high]
    )
}

private func drawImageFit(_ image: NSImage, in rect: NSRect, alpha: CGFloat = 1) {
    let scale = min(rect.width / image.size.width, rect.height / image.size.height)
    let destination = NSRect(
        x: rect.midX - image.size.width * scale / 2,
        y: rect.midY - image.size.height * scale / 2,
        width: image.size.width * scale,
        height: image.size.height * scale
    )
    image.draw(
        in: destination,
        from: .zero,
        operation: .sourceOver,
        fraction: alpha,
        respectFlipped: true,
        hints: [.interpolation: NSImageInterpolation.high]
    )
}

private func loadImage(_ url: URL) throws -> NSImage {
    guard let image = NSImage(contentsOf: url) else {
        throw PromoError.asset("Não foi possível carregar \(url.path)")
    }
    return image
}

private func createPixelBuffer() throws -> CVPixelBuffer {
    var pixelBuffer: CVPixelBuffer?
    let attributes: [CFString: Any] = [
        kCVPixelBufferCGImageCompatibilityKey: true,
        kCVPixelBufferCGBitmapContextCompatibilityKey: true,
        kCVPixelBufferIOSurfacePropertiesKey: [:],
    ]
    let status = CVPixelBufferCreate(
        kCFAllocatorDefault,
        canvasWidth,
        canvasHeight,
        kCVPixelFormatType_32BGRA,
        attributes as CFDictionary,
        &pixelBuffer
    )
    guard status == kCVReturnSuccess, let pixelBuffer else {
        throw PromoError.render("Falha ao criar pixel buffer: \(status)")
    }
    return pixelBuffer
}

private func makeQRCode(content: String, dimension: Int = 520, quietZone: Int = 48) throws -> CGImage {
    guard let filter = CIFilter(name: "CIQRCodeGenerator") else {
        throw PromoError.render("Filtro de QR Code indisponível")
    }
    filter.setValue(Data(content.utf8), forKey: "inputMessage")
    filter.setValue("M", forKey: "inputCorrectionLevel")
    guard let output = filter.outputImage else {
        throw PromoError.render("Falha ao gerar QR Code")
    }

    let available = CGFloat(dimension - quietZone * 2)
    let moduleScale = floor(available / output.extent.width)
    let scaled = output.transformed(by: CGAffineTransform(scaleX: moduleScale, y: moduleScale))
    let ciContext = CIContext(options: [.useSoftwareRenderer: false])
    guard let qrCore = ciContext.createCGImage(scaled, from: scaled.extent) else {
        throw PromoError.render("Falha ao rasterizar QR Code")
    }

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let context = CGContext(
        data: nil,
        width: dimension,
        height: dimension,
        bitsPerComponent: 8,
        bytesPerRow: dimension * 4,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else {
        throw PromoError.render("Falha ao criar o canvas do QR Code")
    }
    context.setFillColor(NSColor.white.cgColor)
    context.fill(CGRect(x: 0, y: 0, width: dimension, height: dimension))
    context.interpolationQuality = .none
    let qrSize = CGFloat(qrCore.width)
    let origin = (CGFloat(dimension) - qrSize) / 2
    context.draw(qrCore, in: CGRect(x: origin, y: origin, width: qrSize, height: qrSize))
    guard let result = context.makeImage() else {
        throw PromoError.render("Falha ao finalizar o QR Code")
    }
    return result
}

private func savePNG(_ image: CGImage, to url: URL) throws {
    let representation = NSBitmapImageRep(cgImage: image)
    guard let data = representation.representation(using: .png, properties: [:]) else {
        throw PromoError.export("Falha ao codificar PNG: \(url.lastPathComponent)")
    }
    try data.write(to: url, options: .atomic)
}

private func validateQRCode(_ image: CGImage, expected: String) throws {
    let request = VNDetectBarcodesRequest()
    request.symbologies = [.qr]
    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    try handler.perform([request])
    let values = (request.results ?? []).compactMap(\.payloadStringValue)
    guard values.contains(expected) else {
        throw PromoError.validation("QR Code inválido. Conteúdo detectado: \(values)")
    }
}

private struct PromoRenderer {
    let scene: NSImage
    let wordmark: NSImage
    let mark: NSImage
    let qrCode: NSImage

    func render(time: Double, into pixelBuffer: CVPixelBuffer) throws {
        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }
        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else {
            throw PromoError.render("Pixel buffer sem endereço base")
        }
        let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        guard let context = CGContext(
            data: baseAddress,
            width: canvasWidth,
            height: canvasHeight,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: colorSpace,
            bitmapInfo: CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.premultipliedFirst.rawValue
        ) else {
            throw PromoError.render("Falha ao criar CGContext para o quadro")
        }

        context.setFillColor(paper.cgColor)
        context.fill(CGRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight))
        context.translateBy(x: 0, y: CGFloat(canvasHeight))
        context.scaleBy(x: 1, y: -1)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: true)
        defer { NSGraphicsContext.restoreGraphicsState() }

        let t = CGFloat(time)
        let impactAlpha = 1 - smoothstep((t - 2.68) / 0.42)
        let flowAlpha = smoothstep((t - 2.68) / 0.38) * (1 - smoothstep((t - 7.08) / 0.42))
        let valueAlpha = smoothstep((t - 7.08) / 0.38) * (1 - smoothstep((t - 10.72) / 0.42))
        let finalAlpha = smoothstep((t - 10.72) / 0.38)

        if impactAlpha > 0.001 { drawImpact(time: t, alpha: impactAlpha) }
        if flowAlpha > 0.001 { drawFlow(time: t, alpha: flowAlpha) }
        if valueAlpha > 0.001 { drawValue(time: t, alpha: valueAlpha) }
        if finalAlpha > 0.001 { drawFinal(time: t, alpha: finalAlpha) }
        drawTransitionFlash(time: t)
    }

    private func drawImpact(time: CGFloat, alpha: CGFloat) {
        let progress = (time / 2.9).clamped()
        let beat = 0.5 + 0.5 * sin(time * 2 * .pi * 124 / 60)
        drawImageCover(scene, in: NSRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight), zoom: 1.03 + 0.085 * progress + 0.004 * beat, alpha: alpha)

        let gradient = NSGradient(colors: [
            deepForest.withAlphaComponent(0.94 * alpha),
            deepForest.withAlphaComponent(0.58 * alpha),
            deepForest.withAlphaComponent(0.06 * alpha),
        ])!
        gradient.draw(in: NSRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight), angle: -90)

        let slam = easeOutCubic(time / 0.20) * (1 - smoothstep((time - 0.48) / 0.22)) * alpha
        let slamScale = 0.80 + 0.20 * slam
        fillRoundedRect(NSRect(x: 54, y: 126, width: 760 * slamScale, height: 210), radius: 30, color: amber, alpha: slam)
        drawText("TRAVOU?", in: NSRect(x: 76, y: 145, width: 910, height: 180), size: 150 * slamScale, weight: .heavy, color: deepForest, alpha: slam, tracking: -4)

        let question = easeOutCubic((time - 0.44) / 0.36) * alpha
        let xOffset = (1 - question) * 76
        drawText("SUA PESQUISA", in: NSRect(x: 68 + xOffset, y: 160, width: 930, height: 100), size: 76, weight: .heavy, color: NSColor.white, alpha: question, tracking: -1.9)
        drawText("VIROU UM", in: NSRect(x: 68 + xOffset, y: 252, width: 930, height: 116), size: 92, weight: .heavy, color: NSColor.white, alpha: question, tracking: -2.5)
        drawText("CAOS?", in: NSRect(x: 68 + xOffset, y: 365, width: 930, height: 154), size: 136, weight: .heavy, color: amber, alpha: question, tracking: -4.0)

        let signal = easeOutCubic((time - 1.25) / 0.42) * alpha
        fillRoundedRect(NSRect(x: 68, y: 566, width: 720 * signal, height: 9), radius: 5, color: electricMint, alpha: signal)
        fillRoundedRect(NSRect(x: 68, y: 614, width: 735, height: 86), radius: 43, color: deepForest, alpha: 0.90 * signal)
        strokeRoundedRect(NSRect(x: 68, y: 614, width: 735, height: 86), radius: 43, color: electricMint, width: 2, alpha: signal)
        drawText("RESPIRA. EXISTE UM CAMINHO.", in: NSRect(x: 92, y: 637, width: 688, height: 46), size: 29, weight: .bold, color: NSColor.white, alpha: signal, tracking: 1.1)

        for index in 0..<7 {
            let delay = CGFloat(index) * 0.055
            let streak = smoothstep((time - 0.72 - delay) / 0.34) * alpha
            let y = 1510 + CGFloat(index) * 45
            let width = 150 + CGFloat(index % 3) * 72
            drawLine(from: NSPoint(x: 1080 - width * streak, y: y), to: NSPoint(x: 1080, y: y), color: index.isMultiple(of: 2) ? amber : electricMint, width: 5, alpha: streak * 0.55)
        }
    }

    private func drawFlow(time: CGFloat, alpha: CGFloat) {
        deepForest.withAlphaComponent(alpha).setFill()
        NSBezierPath(rect: NSRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight)).fill()

        let local = time - 2.8
        let beat = 0.5 + 0.5 * sin(time * 2 * .pi * 124 / 60)
        fillRoundedRect(NSRect(x: 790 - beat * 28, y: -150 - beat * 20, width: 520 + beat * 56, height: 520 + beat * 56), radius: 290, color: electricMint, alpha: 0.12 * alpha)
        fillRoundedRect(NSRect(x: -280, y: 1510, width: 680, height: 680), radius: 340, color: amber, alpha: 0.10 * alpha)
        drawImageFit(mark, in: NSRect(x: 70, y: 70, width: 82, height: 82), alpha: alpha)
        drawText("MAPA DA PESQUISA", in: NSRect(x: 178, y: 88, width: 700, height: 52), size: 28, weight: .bold, color: mint, alpha: alpha, tracking: 2.0)

        let titleReveal = easeOutCubic(local / 0.42) * alpha
        drawText("TRANSFORME SUA IDEIA", in: NSRect(x: 70, y: 186, width: 940, height: 92), size: 64, weight: .heavy, color: NSColor.white, alpha: titleReveal, tracking: -1.7)
        drawText("EM UM MAPA.", in: NSRect(x: 70, y: 274, width: 940, height: 104), size: 82, weight: .heavy, color: amber, alpha: titleReveal, tracking: -2.5)

        let phoneReveal = easeOutCubic((local - 0.20) / 0.52) * alpha
        let phoneY = lerp(520, 438, phoneReveal)
        NSGraphicsContext.saveGraphicsState()
        let shadow = NSShadow()
        shadow.shadowColor = NSColor.black.withAlphaComponent(0.34 * phoneReveal)
        shadow.shadowBlurRadius = 45
        shadow.shadowOffset = NSSize(width: 0, height: 24)
        shadow.set()
        fillRoundedRect(NSRect(x: 102, y: phoneY, width: 876, height: 1110), radius: 72, color: ink, alpha: phoneReveal)
        NSGraphicsContext.restoreGraphicsState()
        fillRoundedRect(NSRect(x: 124, y: phoneY + 22, width: 832, height: 1066), radius: 54, color: paper, alpha: phoneReveal)
        fillRoundedRect(NSRect(x: 426, y: phoneY + 42, width: 228, height: 28), radius: 14, color: ink, alpha: phoneReveal)

        drawText("PROGRESSO DO MAPA", in: NSRect(x: 176, y: phoneY + 108, width: 520, height: 52), size: 27, weight: .bold, color: forest, alpha: phoneReveal, tracking: 1.4)
        drawText("Etapa 3/4", in: NSRect(x: 690, y: phoneY + 108, width: 210, height: 48), size: 26, weight: .bold, color: green, alignment: .right, alpha: phoneReveal)

        let labels = ["PROBLEMÁTICA", "OBJETIVOS", "CAPÍTULOS", "METODOLOGIA"]
        for index in labels.indices {
            let entry = easeOutCubic((local - 0.45 - CGFloat(index) * 0.32) / 0.42) * alpha
            let y = phoneY + 205 + CGFloat(index) * 190
            let x = lerp(index.isMultiple(of: 2) ? -740 : 1130, 170, entry)
            let active = local > 0.62 + CGFloat(index) * 0.48
            fillRoundedRect(NSRect(x: x, y: y, width: 740, height: 142), radius: 28, color: active ? NSColor.white : mint, alpha: entry)
            strokeRoundedRect(NSRect(x: x, y: y, width: 740, height: 142), radius: 28, color: active ? electricMint : green, width: active ? 4 : 2, alpha: entry)
            fillRoundedRect(NSRect(x: x + 24, y: y + 25, width: 92, height: 92), radius: 46, color: index == 3 ? amber : green, alpha: entry)
            drawText("\(index + 1)", in: NSRect(x: x + 24, y: y + 42, width: 92, height: 58), size: 40, weight: .heavy, color: index == 3 ? deepForest : NSColor.white, alignment: .center, alpha: entry)
            drawText(labels[index], in: NSRect(x: x + 144, y: y + 43, width: 550, height: 62), size: 39, weight: .bold, color: ink, alpha: entry, tracking: -0.2)
            if index < 3 {
                drawLine(from: NSPoint(x: x + 70, y: y + 142), to: NSPoint(x: x + 70, y: y + 190), color: electricMint, width: 5, alpha: entry * 0.85)
            }
        }

        let badge = easeOutCubic((local - 2.05) / 0.46) * alpha
        fillRoundedRect(NSRect(x: 232, y: phoneY + 985, width: 616, height: 82), radius: 41, color: amber, alpha: badge)
        drawText("MAPA RÁPIDO OU AVANÇADO", in: NSRect(x: 232, y: phoneY + 1007, width: 616, height: 46), size: 25, weight: .heavy, color: deepForest, alignment: .center, alpha: badge, tracking: 1.1)
    }

    private func drawPerson(center: NSPoint, label: String, reveal: CGFloat) {
        guard reveal > 0.001 else { return }
        let rise = (1 - reveal) * 34
        let x = center.x
        let y = center.y + rise
        green.withAlphaComponent(reveal).setFill()
        NSBezierPath(ovalIn: NSRect(x: x - 34, y: y - 74, width: 68, height: 68)).fill()
        fillRoundedRect(NSRect(x: x - 64, y: y - 4, width: 128, height: 94), radius: 46, color: forest, alpha: reveal)
        drawText(label, in: NSRect(x: x - 130, y: y + 112, width: 260, height: 48), size: 27, weight: .bold, color: forest, alignment: .center, alpha: reveal, tracking: 1.5)
    }

    private func drawValue(time: CGFloat, alpha: CGFloat) {
        warmPaper.withAlphaComponent(alpha).setFill()
        NSBezierPath(rect: NSRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight)).fill()

        let local = time - 7.15
        let beat = 0.5 + 0.5 * sin(time * 2 * .pi * 124 / 60)
        fillRoundedRect(NSRect(x: 760 - beat * 20, y: -190, width: 540 + beat * 40, height: 540 + beat * 40), radius: 290, color: amber, alpha: 0.23 * alpha)
        fillRoundedRect(NSRect(x: -290, y: 1500, width: 720, height: 720), radius: 360, color: electricMint, alpha: 0.12 * alpha)
        drawImageFit(mark, in: NSRect(x: 72, y: 70, width: 86, height: 86), alpha: alpha)

        let title = easeOutCubic(local / 0.38) * alpha
        drawText("VOCÊ", in: NSRect(x: 68, y: 190, width: 930, height: 142), size: 130, weight: .heavy, color: forest, alpha: title, tracking: -4)
        drawText("NO CONTROLE.", in: NSRect(x: 68, y: 318, width: 950, height: 130), size: 104, weight: .heavy, color: green, alpha: title, tracking: -3)

        let benefits: [(String, String, NSColor)] = [
            ("✦", "IA PARA ESTRUTURAR", green),
            ("✓", "ORIENTADOR PARA VALIDAR", forest),
            ("→", "SEU PROJETO PARA AVANÇAR", amber),
        ]
        for index in benefits.indices {
            let entry = easeOutCubic((local - 0.34 - CGFloat(index) * 0.42) / 0.46) * alpha
            let y = 560 + CGFloat(index) * 225
            let x = lerp(index.isMultiple(of: 2) ? -980 : 1120, 68, entry)
            fillRoundedRect(NSRect(x: x, y: y, width: 944, height: 174), radius: 36, color: NSColor.white, alpha: entry)
            strokeRoundedRect(NSRect(x: x, y: y, width: 944, height: 174), radius: 36, color: benefits[index].2, width: 4, alpha: entry)
            fillRoundedRect(NSRect(x: x + 30, y: y + 31, width: 112, height: 112), radius: 56, color: benefits[index].2, alpha: entry)
            drawText(benefits[index].0, in: NSRect(x: x + 30, y: y + 50, width: 112, height: 74), size: 50, weight: .heavy, color: index == 2 ? deepForest : NSColor.white, alignment: .center, alpha: entry)
            drawText(benefits[index].1, in: NSRect(x: x + 174, y: y + 55, width: 720, height: 72), size: 37, weight: .heavy, color: ink, alpha: entry, tracking: -0.5)
        }

        let people = easeOutCubic((local - 1.55) / 0.48) * alpha
        drawPerson(center: NSPoint(x: 258, y: 1438), label: "ALUNO", reveal: people)
        drawPerson(center: NSPoint(x: 822, y: 1438), label: "ORIENTADOR", reveal: people)
        drawLine(from: NSPoint(x: 375, y: 1438), to: NSPoint(x: 705, y: 1438), color: green, width: 10, alpha: people)
        fillRoundedRect(NSRect(x: 474, y: 1372, width: 132, height: 132), radius: 66, color: deepForest, alpha: people)
        drawImageFit(mark, in: NSRect(x: 502, y: 1396, width: 76, height: 82), alpha: people)
        fillRoundedRect(NSRect(x: 290, y: 1660, width: 500, height: 86), radius: 43, color: deepForest, alpha: people)
        drawText("MAPA DA PESQUISA", in: NSRect(x: 290, y: 1682, width: 500, height: 48), size: 28, weight: .bold, color: NSColor.white, alignment: .center, alpha: people, tracking: 1.8)
    }

    private func drawFinal(time: CGFloat, alpha: CGFloat) {
        deepForest.withAlphaComponent(alpha).setFill()
        NSBezierPath(rect: NSRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight)).fill()

        let local = time - 10.8
        let beat = 0.5 + 0.5 * sin(time * 2 * .pi * 124 / 60)
        fillRoundedRect(NSRect(x: 760 - beat * 20, y: -210, width: 610 + beat * 40, height: 610 + beat * 40), radius: 330, color: electricMint, alpha: 0.12 * alpha)
        fillRoundedRect(NSRect(x: -330, y: 1540, width: 720, height: 720), radius: 360, color: amber, alpha: 0.18 * alpha)

        let logoReveal = easeOutCubic(local / 0.36) * alpha
        fillRoundedRect(NSRect(x: 62, y: 70, width: 956, height: 318), radius: 52, color: NSColor.white, alpha: logoReveal)
        drawImageFit(wordmark, in: NSRect(x: 100, y: 105, width: 880, height: 248), alpha: logoReveal)

        let titleReveal = easeOutCubic((local - 0.12) / 0.42) * alpha
        drawText("TIRE SUA PESQUISA", in: NSRect(x: 70, y: 448, width: 940, height: 86), size: 67, weight: .heavy, color: NSColor.white, alignment: .center, alpha: titleReveal, tracking: -1.9)
        drawText("DO PAPEL.", in: NSRect(x: 70, y: 528, width: 940, height: 104), size: 88, weight: .heavy, color: amber, alignment: .center, alpha: titleReveal, tracking: -2.8)

        fillRoundedRect(NSRect(x: 310, y: 664, width: 460, height: 92), radius: 46, color: amber, alpha: titleReveal)
        drawText("COMECE AGORA", in: NSRect(x: 310, y: 686, width: 460, height: 52), size: 32, weight: .heavy, color: deepForest, alignment: .center, alpha: titleReveal, tracking: 1.8)

        NSGraphicsContext.saveGraphicsState()
        let shadow = NSShadow()
        shadow.shadowColor = NSColor.black.withAlphaComponent(0.30 * alpha)
        shadow.shadowBlurRadius = 32
        shadow.shadowOffset = NSSize(width: 0, height: 18)
        shadow.set()
        fillRoundedRect(NSRect(x: 276, y: 824, width: 528, height: 528), radius: 38, color: NSColor.white, alpha: alpha)
        NSGraphicsContext.restoreGraphicsState()
        drawImageFit(qrCode, in: NSRect(x: 304, y: 852, width: 472, height: 472), alpha: alpha)

        drawText("ESCANEIE E COMECE", in: NSRect(x: 120, y: 1410, width: 840, height: 54), size: 29, weight: .bold, color: mint, alignment: .center, alpha: alpha, tracking: 2.3)
        drawText("mapadapesquisa.com.br", in: NSRect(x: 80, y: 1480, width: 920, height: 72), size: 43, weight: .bold, color: NSColor.white, alignment: .center, alpha: alpha, tracking: -0.5)
        fillRoundedRect(NSRect(x: 270, y: 1584, width: 540, height: 76), radius: 38, color: green, alpha: alpha)
        drawText("MAPA RÁPIDO OU AVANÇADO", in: NSRect(x: 270, y: 1604, width: 540, height: 44), size: 23, weight: .bold, color: NSColor.white, alignment: .center, alpha: alpha, tracking: 1.0)

        let pulse = 0.62 + 0.38 * beat
        strokeRoundedRect(NSRect(x: 270, y: 818, width: 540, height: 540), radius: 44, color: electricMint, width: 5, alpha: alpha * pulse)
        strokeRoundedRect(NSRect(x: 252 - beat * 5, y: 800 - beat * 5, width: 576 + beat * 10, height: 576 + beat * 10), radius: 54, color: amber, width: 2, alpha: alpha * (1 - beat) * 0.6)
    }

    private func drawTransitionFlash(time: CGFloat) {
        for point in [CGFloat(2.82), 7.22, 10.84] {
            let distance = abs(time - point)
            guard distance < 0.15 else { continue }
            let strength = (1 - distance / 0.15) * 0.44
            NSColor.white.withAlphaComponent(strength).setFill()
            NSBezierPath(rect: NSRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight)).fill()
        }
    }
}

private func pixelBufferImage(_ pixelBuffer: CVPixelBuffer) throws -> CGImage {
    let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
    let context = CIContext(options: [.useSoftwareRenderer: false])
    guard let image = context.createCGImage(ciImage, from: CGRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight)) else {
        throw PromoError.render("Falha ao converter quadro em imagem")
    }
    return image
}

private func renderStill(renderer: PromoRenderer, time: Double, output: URL) throws -> CGImage {
    let pixelBuffer = try createPixelBuffer()
    try renderer.render(time: time, into: pixelBuffer)
    let image = try pixelBufferImage(pixelBuffer)
    try savePNG(image, to: output)
    return image
}

private func makeSilentVideo(renderer: PromoRenderer, output: URL) async throws {
    try? FileManager.default.removeItem(at: output)
    let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
    let settings: [String: Any] = [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: canvasWidth,
        AVVideoHeightKey: canvasHeight,
        AVVideoCompressionPropertiesKey: [
            AVVideoAverageBitRateKey: 8_000_000,
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
            AVVideoExpectedSourceFrameRateKey: framesPerSecond,
        ],
    ]
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    input.expectsMediaDataInRealTime = false
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(
        assetWriterInput: input,
        sourcePixelBufferAttributes: [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
            kCVPixelBufferWidthKey as String: canvasWidth,
            kCVPixelBufferHeightKey as String: canvasHeight,
            kCVPixelBufferCGImageCompatibilityKey as String: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
        ]
    )
    guard writer.canAdd(input) else {
        throw PromoError.export("AVAssetWriter recusou a trilha de vídeo")
    }
    writer.add(input)
    guard writer.startWriting() else {
        throw PromoError.export("Falha ao iniciar vídeo: \(writer.error?.localizedDescription ?? "desconhecida")")
    }
    writer.startSession(atSourceTime: .zero)

    let frameCount = Int(videoDuration * Double(framesPerSecond))
    for frame in 0..<frameCount {
        while !input.isReadyForMoreMediaData {
            try await Task.sleep(nanoseconds: 1_000_000)
        }
        guard let pool = adaptor.pixelBufferPool else {
            throw PromoError.export("Pool de pixel buffers indisponível")
        }
        var pixelBuffer: CVPixelBuffer?
        let status = CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, pool, &pixelBuffer)
        guard status == kCVReturnSuccess, let pixelBuffer else {
            throw PromoError.export("Falha ao obter pixel buffer: \(status)")
        }
        let time = Double(frame) / Double(framesPerSecond)
        try renderer.render(time: time, into: pixelBuffer)
        let presentationTime = CMTime(value: Int64(frame), timescale: framesPerSecond)
        guard adaptor.append(pixelBuffer, withPresentationTime: presentationTime) else {
            throw PromoError.export("Falha ao anexar quadro \(frame): \(writer.error?.localizedDescription ?? "desconhecida")")
        }
    }
    input.markAsFinished()

    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
        writer.finishWriting {
            if writer.status == .completed {
                continuation.resume()
            } else {
                continuation.resume(throwing: PromoError.export("Falha ao finalizar vídeo: \(writer.error?.localizedDescription ?? "desconhecida")"))
            }
        }
    }
}

private let soundtrackBPM = 124.0

private struct AudioMetrics {
    let sourceID: String
    let peakDBFS: Double
    let rmsDBFS: Double
}

private func positiveModulo(_ value: Double, _ modulus: Double) -> Double {
    let result = value.truncatingRemainder(dividingBy: modulus)
    return result < 0 ? result + modulus : result
}

private func softSaw(frequency: Double, time: Double, harmonics: Int = 7) -> Double {
    guard time >= 0 else { return 0 }
    var value = 0.0
    for harmonic in 1...harmonics {
        value += sin(2 * .pi * frequency * Double(harmonic) * time) / Double(harmonic)
    }
    return value * 0.62
}

private func triangle(frequency: Double, time: Double) -> Double {
    guard time >= 0 else { return 0 }
    return 2 / .pi * asin(sin(2 * .pi * frequency * time))
}

private func noise(sampleIndex: Int) -> Double {
    var value = UInt64(bitPattern: Int64(sampleIndex &* 1_664_525 &+ 1_013_904_223))
    value ^= value >> 13
    value &*= 0x5DEECE66D
    value ^= value >> 17
    return Double(value & 0xffff) / 32_767.5 - 1
}

private func pluck(time: Double, beatDuration: Double, delay: Double = 0) -> (Double, Double) {
    let shifted = time - delay
    guard shifted >= 0 else { return (0, 0) }
    let stepDuration = beatDuration / 2
    let step = Int(floor(shifted / stepDuration))
    let phase = positiveModulo(shifted, stepDuration)
    let chords: [[Double]] = [
        [293.66, 349.23, 440.00],
        [233.08, 293.66, 349.23],
        [349.23, 440.00, 523.25],
        [261.63, 329.63, 392.00],
    ]
    let chord = chords[(step / 4) % chords.count]
    let frequency = chord[step % chord.count] * (step.isMultiple(of: 6) ? 2 : 1)
    let envelope = exp(-phase * 10.5)
    let tone = (sin(2 * .pi * frequency * phase) * 0.72 + triangle(frequency: frequency * 2, time: phase) * 0.28) * envelope
    let pan = step.isMultiple(of: 2) ? 0.30 : 0.70
    return (tone * (1 - pan), tone * pan)
}

private func musicSample(time: Double, sampleIndex: Int) -> (Double, Double) {
    let beatDuration = 60 / soundtrackBPM
    let beatPhase = positiveModulo(time, beatDuration)
    let beatIndex = Int(floor(time / beatDuration))
    let progression = max(0, beatIndex / 2) % 4
    let roots = [73.42, 58.27, 87.31, 65.41]
    let chords: [[Double]] = [
        [146.83, 174.61, 220.00],
        [116.54, 146.83, 174.61],
        [174.61, 220.00, 261.63],
        [130.81, 164.81, 196.00],
    ]

    let introEnergy = smoothstep(CGFloat((time - 0.55) / 1.15))
    let grooveEnergy = smoothstep(CGFloat((time - 2.55) / 0.45))
    let climaxEnergy = smoothstep(CGFloat((time - 7.05) / 0.65))
    let sidechain = 0.42 + 0.58 * (1 - exp(-beatPhase * 9.5))

    var pad = 0.0
    for (index, frequency) in chords[progression].enumerated() {
        let detune = [0.997, 1.0, 1.004][index]
        pad += triangle(frequency: frequency * detune, time: time) * [0.038, 0.031, 0.025][index]
        pad += sin(2 * .pi * frequency * 0.5 * time) * [0.014, 0.011, 0.009][index]
    }
    pad *= sidechain * Double(0.45 + 0.55 * introEnergy)

    var kick = 0.0
    if time > 0.18 {
        let envelope = exp(-beatPhase * 13.5)
        let phase = 2 * .pi * (48 * beatPhase + 7.4 * (1 - exp(-beatPhase * 18)))
        kick = sin(phase) * envelope * 0.52
        kick += sin(2 * .pi * 92 * beatPhase) * exp(-beatPhase * 32) * 0.10
    }

    var clap = 0.0
    if beatIndex % 4 == 1 || beatIndex % 4 == 3 {
        for burst in [0.0, 0.018, 0.036] {
            let local = beatPhase - burst
            if local >= 0 && local < 0.18 {
                let noisy = noise(sampleIndex: sampleIndex - Int(burst * 44_100))
                clap += noisy * exp(-local * 24) * 0.12 * Double(grooveEnergy)
                clap += sin(2 * .pi * 185 * local) * exp(-local * 18) * 0.035 * Double(grooveEnergy)
            }
        }
    }

    let eighth = beatDuration / 2
    let hatPhase = positiveModulo(time, eighth)
    let highNoise = noise(sampleIndex: sampleIndex) - noise(sampleIndex: sampleIndex - 1) * 0.82
    var hat = highNoise * exp(-hatPhase * 48) * 0.075 * Double(grooveEnergy)
    if (Int(floor(time / eighth)) % 4) == 3 {
        hat += highNoise * exp(-hatPhase * 18) * 0.045 * Double(grooveEnergy)
    }

    let bassEnvelope = exp(-beatPhase * 4.4)
    let root = roots[progression]
    var bass = softSaw(frequency: root, time: time, harmonics: 5) * bassEnvelope * 0.15 * Double(grooveEnergy)
    bass += sin(2 * .pi * root * 0.5 * time) * bassEnvelope * 0.10 * Double(grooveEnergy)

    let directPluck = pluck(time: time, beatDuration: beatDuration)
    let echoPluck = pluck(time: time, beatDuration: beatDuration, delay: 0.18)
    let pluckLevel = 0.18 * Double(0.35 + 0.65 * climaxEnergy)
    var left = pad + kick + clap + hat * 0.78 + bass + directPluck.0 * pluckLevel + echoPluck.0 * pluckLevel * 0.32
    var right = pad * 0.97 + kick + clap * 0.94 + hat + bass * 0.96 + directPluck.1 * pluckLevel + echoPluck.1 * pluckLevel * 0.32

    if time < 0.75 {
        let impact = sin(2 * .pi * (52 - time * 24) * time) * exp(-time * 5.0) * 0.40
        let snap = highNoise * exp(-time * 28) * 0.12
        left += impact + snap
        right += impact - snap * 0.4
    }

    if time >= 9.65 && time < 10.86 {
        let local = time - 9.65
        let progress = local / 1.21
        let riser = highNoise * progress * progress * 0.12
        let sweep = sin(2 * .pi * (220 + 620 * progress * progress) * local) * progress * 0.035
        left += riser + sweep
        right += riser * 0.86 - sweep
    }

    if time >= 10.82 && time < 11.75 {
        let local = time - 10.82
        let hitEnvelope = exp(-local * 4.8)
        let hit = (sin(2 * .pi * 98 * local) * 0.26 + sin(2 * .pi * 784 * local) * 0.07) * hitEnvelope
        left += hit
        right += hit
    }

    let masterEnvelope = max(0, min(1, min(time / 0.06, (videoDuration - time) / 0.55)))
    return (tanh(left * 1.35) * masterEnvelope, tanh(right * 1.35) * masterEnvelope)
}

private func makeSoundtrack(output: URL) throws -> AudioMetrics {
    let sampleRate: UInt32 = 44_100
    let channels: UInt16 = 2
    let bitsPerSample: UInt16 = 16
    let sampleCount = Int(Double(sampleRate) * videoDuration)
    let blockAlign = channels * bitsPerSample / 8
    let byteRate = sampleRate * UInt32(blockAlign)
    let dataSize = UInt32(sampleCount) * UInt32(blockAlign)

    var leftSamples = [Double](repeating: 0, count: sampleCount)
    var rightSamples = [Double](repeating: 0, count: sampleCount)
    var rawPeak = 0.0
    for index in 0..<sampleCount {
        let time = Double(index) / Double(sampleRate)
        let sample = musicSample(time: time, sampleIndex: index)
        leftSamples[index] = sample.0
        rightSamples[index] = sample.1
        rawPeak = max(rawPeak, max(abs(sample.0), abs(sample.1)))
    }
    let gain = rawPeak > 0 ? 0.89 / rawPeak : 1

    var squareSum = 0.0
    var wav = Data()
    wav.appendASCII("RIFF")
    wav.appendLittleEndian(UInt32(36) + dataSize)
    wav.appendASCII("WAVE")
    wav.appendASCII("fmt ")
    wav.appendLittleEndian(UInt32(16))
    wav.appendLittleEndian(UInt16(1))
    wav.appendLittleEndian(channels)
    wav.appendLittleEndian(sampleRate)
    wav.appendLittleEndian(byteRate)
    wav.appendLittleEndian(blockAlign)
    wav.appendLittleEndian(bitsPerSample)
    wav.appendASCII("data")
    wav.appendLittleEndian(dataSize)

    for index in 0..<sampleCount {
        let leftValue = max(-0.95, min(0.95, leftSamples[index] * gain))
        let rightValue = max(-0.95, min(0.95, rightSamples[index] * gain))
        squareSum += leftValue * leftValue + rightValue * rightValue
        let left = Int16(leftValue * Double(Int16.max))
        let right = Int16(rightValue * Double(Int16.max))
        wav.appendLittleEndian(left)
        wav.appendLittleEndian(right)
    }
    try wav.write(to: output, options: .atomic)
    let peak = min(0.95, rawPeak * gain)
    let rms = sqrt(squareSum / Double(sampleCount * 2))
    return AudioMetrics(
        sourceID: "local-synth-124bpm-draft",
        peakDBFS: 20 * log10(max(peak, 0.000_001)),
        rmsDBFS: 20 * log10(max(rms, 0.000_001))
    )
}

private func analyzeSoundtrack(output: URL, seconds: Double) throws -> AudioMetrics {
    let file = try AVAudioFile(forReading: output)
    let format = file.processingFormat
    let requestedFrames = min(file.length, AVAudioFramePosition(format.sampleRate * seconds))
    guard requestedFrames > 0,
          let buffer = AVAudioPCMBuffer(
              pcmFormat: format,
              frameCapacity: AVAudioFrameCount(requestedFrames)
          ) else {
        throw PromoError.validation("Trilha premium vazia ou incompatível")
    }
    try file.read(into: buffer, frameCount: AVAudioFrameCount(requestedFrames))
    guard let channels = buffer.floatChannelData else {
        throw PromoError.validation("Não foi possível analisar a trilha premium")
    }

    let channelCount = Int(format.channelCount)
    let frameCount = Int(buffer.frameLength)
    var peak = 0.0
    var squareSum = 0.0
    for channel in 0..<channelCount {
        for frame in 0..<frameCount {
            let value = Double(channels[channel][frame])
            peak = max(peak, abs(value))
            squareSum += value * value
        }
    }
    let rms = sqrt(squareSum / Double(max(1, channelCount * frameCount)))
    return AudioMetrics(
        sourceID: "heygen-astral-aa1ba64cd12042e89800c7356498ff40",
        peakDBFS: 20 * log10(max(peak, 0.000_001)),
        rmsDBFS: 20 * log10(max(rms, 0.000_001))
    )
}

private func combine(video: URL, audio: URL, output: URL) async throws {
    try? FileManager.default.removeItem(at: output)
    let videoAsset = AVURLAsset(url: video)
    let audioAsset = AVURLAsset(url: audio)
    guard let sourceVideoTrack = try await videoAsset.loadTracks(withMediaType: .video).first,
          let sourceAudioTrack = try await audioAsset.loadTracks(withMediaType: .audio).first else {
        throw PromoError.export("Trilha de vídeo ou áudio ausente")
    }

    let duration = CMTime(seconds: videoDuration, preferredTimescale: 600)
    let composition = AVMutableComposition()
    guard let videoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid),
          let audioTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else {
        throw PromoError.export("Falha ao criar composição final")
    }
    try videoTrack.insertTimeRange(CMTimeRange(start: .zero, duration: duration), of: sourceVideoTrack, at: .zero)
    try audioTrack.insertTimeRange(CMTimeRange(start: .zero, duration: duration), of: sourceAudioTrack, at: .zero)
    videoTrack.preferredTransform = try await sourceVideoTrack.load(.preferredTransform)

    guard let exporter = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else {
        throw PromoError.export("Exportador final indisponível")
    }
    let audioMix = AVMutableAudioMix()
    let audioParameters = AVMutableAudioMixInputParameters(track: audioTrack)
    audioParameters.setVolumeRamp(
        fromStartVolume: 0,
        toEndVolume: 1.0,
        timeRange: CMTimeRange(start: .zero, duration: CMTime(seconds: 0.12, preferredTimescale: 600))
    )
    audioParameters.setVolume(1.0, at: CMTime(seconds: 0.12, preferredTimescale: 600))
    audioParameters.setVolumeRamp(
        fromStartVolume: 1.0,
        toEndVolume: 0,
        timeRange: CMTimeRange(
            start: CMTime(seconds: 14.35, preferredTimescale: 600),
            duration: CMTime(seconds: 0.65, preferredTimescale: 600)
        )
    )
    audioMix.inputParameters = [audioParameters]
    exporter.audioMix = audioMix
    exporter.shouldOptimizeForNetworkUse = true
    try await exporter.export(to: output, as: .mp4)
}

private func technicalReport(video: URL, qrPayload: String, audioMetrics: AudioMetrics) async throws -> [String: Any] {
    let asset = AVURLAsset(url: video)
    let duration = try await asset.load(.duration)
    guard let videoTrack = try await asset.loadTracks(withMediaType: .video).first else {
        throw PromoError.validation("Vídeo final sem trilha visual")
    }
    let size = try await videoTrack.load(.naturalSize)
    let frameRate = try await videoTrack.load(.nominalFrameRate)
    let audioTracks = try await asset.loadTracks(withMediaType: .audio)
    let seconds = CMTimeGetSeconds(duration)

    guard abs(seconds - videoDuration) < 0.08 else {
        throw PromoError.validation("Duração inesperada: \(seconds)")
    }
    guard Int(size.width.rounded()) == canvasWidth, Int(size.height.rounded()) == canvasHeight else {
        throw PromoError.validation("Resolução inesperada: \(size)")
    }
    guard abs(Double(frameRate) - Double(framesPerSecond)) < 0.1 else {
        throw PromoError.validation("Frame rate inesperado: \(frameRate)")
    }
    guard !audioTracks.isEmpty else {
        throw PromoError.validation("Vídeo final sem áudio")
    }

    return [
        "audioTrackCount": audioTracks.count,
        "durationSeconds": seconds,
        "frameRate": frameRate,
        "height": Int(size.height.rounded()),
        "peakDBFS": audioMetrics.peakDBFS,
        "qrPayload": qrPayload,
        "rmsDBFS": audioMetrics.rmsDBFS,
        "soundtrackSource": audioMetrics.sourceID,
        "videoCodec": "H.264",
        "width": Int(size.width.rounded()),
    ]
}

@main
private struct SocialPromoGenerator {
    static func main() async throws {
        let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true)
        let outputDirectory = root.appendingPathComponent("outputs/social-promo-c79", isDirectory: true)
        try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

        let scene = try loadImage(outputDirectory.appendingPathComponent("scene-chaos.png"))
        let wordmark = try loadImage(root.appendingPathComponent("public/brand/mapa-da-pesquisa-wordmark.png"))
        let mark = try loadImage(root.appendingPathComponent("public/brand/mapa-da-pesquisa-app-icon.png"))

        let qrCGImage = try makeQRCode(content: targetURL)
        try validateQRCode(qrCGImage, expected: targetURL)
        let qrURL = outputDirectory.appendingPathComponent("qr-mapadapesquisa.png")
        try savePNG(qrCGImage, to: qrURL)
        let qrImage = NSImage(cgImage: qrCGImage, size: NSSize(width: 520, height: 520))

        let renderer = PromoRenderer(scene: scene, wordmark: wordmark, mark: mark, qrCode: qrImage)
        _ = try renderStill(renderer: renderer, time: 0.28, output: outputDirectory.appendingPathComponent("frame-hook.png"))
        _ = try renderStill(renderer: renderer, time: 1.55, output: outputDirectory.appendingPathComponent("cover.png"))
        _ = try renderStill(renderer: renderer, time: 5.45, output: outputDirectory.appendingPathComponent("frame-product.png"))
        _ = try renderStill(renderer: renderer, time: 8.90, output: outputDirectory.appendingPathComponent("frame-value.png"))
        let finalFrame = try renderStill(renderer: renderer, time: 12.50, output: outputDirectory.appendingPathComponent("frame-final.png"))
        try validateQRCode(finalFrame, expected: targetURL)

        let silentVideo = outputDirectory.appendingPathComponent(".render-silent.mp4")
        let soundtrack = outputDirectory.appendingPathComponent("soundtrack-premium-astral.wav")
        let finalVideo = outputDirectory.appendingPathComponent("mapa-da-pesquisa-social-15s-v2.mp4")
        try await makeSilentVideo(renderer: renderer, output: silentVideo)
        guard FileManager.default.fileExists(atPath: soundtrack.path) else {
            throw PromoError.asset("A trilha premium selecionada não está disponível")
        }
        let audioMetrics = try analyzeSoundtrack(output: soundtrack, seconds: videoDuration)
        try await combine(video: silentVideo, audio: soundtrack, output: finalVideo)
        try? FileManager.default.removeItem(at: silentVideo)

        let report = try await technicalReport(video: finalVideo, qrPayload: targetURL, audioMetrics: audioMetrics)
        let reportData = try JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes])
        try reportData.write(to: outputDirectory.appendingPathComponent("technical-report.json"), options: .atomic)
        print(String(data: reportData, encoding: .utf8)!)
    }
}
