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
        let impactAlpha = 1 - smoothstep((t - 2.75) / 0.65)
        let flowAlpha = smoothstep((t - 2.75) / 0.65) * (1 - smoothstep((t - 9.95) / 0.75))
        let finalAlpha = smoothstep((t - 9.95) / 0.55)

        if impactAlpha > 0.001 { drawImpact(time: t, alpha: impactAlpha) }
        if flowAlpha > 0.001 { drawFlow(time: t, alpha: flowAlpha) }
        if finalAlpha > 0.001 { drawFinal(time: t, alpha: finalAlpha) }
    }

    private func drawImpact(time: CGFloat, alpha: CGFloat) {
        let progress = (time / 3.2).clamped()
        drawImageCover(scene, in: NSRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight), zoom: 1 + 0.045 * progress, alpha: alpha)

        let gradient = NSGradient(colors: [
            deepForest.withAlphaComponent(0.80 * alpha),
            deepForest.withAlphaComponent(0.32 * alpha),
            NSColor.clear,
        ])!
        gradient.draw(in: NSRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight), angle: -90)

        let lines = ["SUA PESQUISA", "NÃO PRECISA", "COMEÇAR", "NO ESCURO."]
        for (index, line) in lines.enumerated() {
            let reveal = easeOutCubic((time - 0.18 - CGFloat(index) * 0.20) / 0.48) * alpha
            let offset = (1 - reveal) * 52
            drawText(
                line,
                in: NSRect(x: 72 + offset, y: 190 + CGFloat(index) * 106, width: 900, height: 112),
                size: index == 3 ? 91 : 82,
                weight: .heavy,
                color: index == 3 ? amber : NSColor.white,
                alpha: reveal,
                tracking: -1.8
            )
        }

        let underline = easeOutCubic((time - 1.15) / 0.55) * alpha
        fillRoundedRect(NSRect(x: 74, y: 635, width: 360 * underline, height: 8), radius: 4, color: green, alpha: underline)

        let paperSpecs: [(CGFloat, CGFloat, CGFloat, CGFloat)] = [
            (92, 1300, -0.12, 0.0), (760, 1210, 0.10, 0.35), (160, 1520, 0.08, 0.7),
            (820, 1550, -0.10, 1.0), (520, 1690, 0.06, 1.4),
        ]
        for (index, item) in paperSpecs.enumerated() {
            let localAlpha = alpha * 0.20 * smoothstep((time - 0.5 - CGFloat(index) * 0.08) / 0.5)
            let drift = sin(time * 1.8 + item.3) * 18
            let context = NSGraphicsContext.current!.cgContext
            context.saveGState()
            context.translateBy(x: item.0 + 90, y: item.1 + drift + 60)
            context.rotate(by: item.2)
            fillRoundedRect(NSRect(x: -90, y: -60, width: 180, height: 120), radius: 10, color: NSColor.white, alpha: localAlpha)
            drawLine(from: NSPoint(x: -62, y: -24), to: NSPoint(x: 55, y: -24), color: forest, width: 4, alpha: localAlpha)
            drawLine(from: NSPoint(x: -62, y: 0), to: NSPoint(x: 34, y: 0), color: forest, width: 4, alpha: localAlpha)
            drawLine(from: NSPoint(x: -62, y: 24), to: NSPoint(x: 48, y: 24), color: forest, width: 4, alpha: localAlpha)
            context.restoreGState()
        }
    }

    private func drawFlow(time: CGFloat, alpha: CGFloat) {
        paper.withAlphaComponent(alpha).setFill()
        NSBezierPath(rect: NSRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight)).fill()

        fillRoundedRect(NSRect(x: 760, y: -140, width: 500, height: 500), radius: 250, color: mint, alpha: 0.45 * alpha)
        fillRoundedRect(NSRect(x: -220, y: 1450, width: 620, height: 620), radius: 310, color: green, alpha: 0.08 * alpha)
        drawImageFit(mark, in: NSRect(x: 74, y: 74, width: 76, height: 76), alpha: alpha)

        let titleReveal = easeOutCubic((time - 3.15) / 0.55) * alpha
        drawText("DA IDEIA AO MAPA,", in: NSRect(x: 72, y: 174, width: 930, height: 92), size: 69, weight: .heavy, color: forest, alpha: titleReveal, tracking: -1.6)
        drawText("ETAPA POR ETAPA.", in: NSRect(x: 72, y: 255, width: 930, height: 88), size: 63, weight: .bold, color: green, alpha: titleReveal, tracking: -1.1)

        let labels = ["PROBLEMÁTICA", "OBJETIVOS", "CAPÍTULOS", "METODOLOGIA"]
        let cardY: [CGFloat] = [440, 650, 860, 1070]
        for index in labels.indices {
            let start = 3.35 + CGFloat(index) * 0.62
            let entry = easeOutCubic((time - start) / 0.58) * alpha
            guard entry > 0.001 else { continue }
            let x = lerp(1110, 78, entry)
            let rect = NSRect(x: x, y: cardY[index], width: 924, height: 162)

            NSGraphicsContext.saveGraphicsState()
            let shadow = NSShadow()
            shadow.shadowColor = deepForest.withAlphaComponent(0.10 * entry)
            shadow.shadowBlurRadius = 22
            shadow.shadowOffset = NSSize(width: 0, height: 12)
            shadow.set()
            fillRoundedRect(rect, radius: 30, color: NSColor.white, alpha: entry)
            NSGraphicsContext.restoreGraphicsState()

            strokeRoundedRect(rect, radius: 30, color: mint, width: 2, alpha: entry)
            fillRoundedRect(NSRect(x: x + 30, y: cardY[index] + 31, width: 100, height: 100), radius: 50, color: index == 3 ? amber : green, alpha: entry)
            drawText("\(index + 1)", in: NSRect(x: x + 30, y: cardY[index] + 48, width: 100, height: 62), size: 43, weight: .heavy, color: index == 3 ? deepForest : NSColor.white, alignment: .center, alpha: entry)
            drawText(labels[index], in: NSRect(x: x + 166, y: cardY[index] + 49, width: 690, height: 66), size: 43, weight: .bold, color: ink, alpha: entry, tracking: 0.5)

            if index < labels.count - 1 {
                drawLine(from: NSPoint(x: x + 80, y: cardY[index] + 162), to: NSPoint(x: x + 80, y: cardY[index] + 208), color: green, width: 5, alpha: entry * 0.65)
            }
        }

        let peopleReveal = easeOutCubic((time - 6.4) / 0.75) * alpha
        drawPerson(center: NSPoint(x: 300, y: 1452), label: "ALUNO", reveal: peopleReveal)
        drawPerson(center: NSPoint(x: 780, y: 1452), label: "ORIENTADOR", reveal: peopleReveal)
        drawLine(from: NSPoint(x: 405, y: 1452), to: NSPoint(x: 675, y: 1452), color: green, width: 8, alpha: peopleReveal)
        fillRoundedRect(NSRect(x: 494, y: 1407, width: 92, height: 92), radius: 46, color: amber, alpha: peopleReveal)
        drawText("✓", in: NSRect(x: 494, y: 1420, width: 92, height: 64), size: 48, weight: .heavy, color: deepForest, alignment: .center, alpha: peopleReveal)

        let aiReveal = easeOutCubic((time - 7.1) / 0.65) * alpha
        fillRoundedRect(NSRect(x: 304, y: 1660, width: 472, height: 92), radius: 46, color: deepForest, alpha: aiReveal)
        drawText("APOIO DA IA", in: NSRect(x: 304, y: 1680, width: 472, height: 52), size: 32, weight: .bold, color: NSColor.white, alignment: .center, alpha: aiReveal, tracking: 2.4)
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

    private func drawFinal(time: CGFloat, alpha: CGFloat) {
        paper.withAlphaComponent(alpha).setFill()
        NSBezierPath(rect: NSRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight)).fill()

        fillRoundedRect(NSRect(x: 710, y: -210, width: 620, height: 620), radius: 310, color: mint, alpha: 0.55 * alpha)
        fillRoundedRect(NSRect(x: -300, y: 1530, width: 680, height: 680), radius: 340, color: amber, alpha: 0.12 * alpha)
        drawImageFit(wordmark, in: NSRect(x: 92, y: 140, width: 896, height: 300), alpha: alpha)

        drawText("DA PRIMEIRA PERGUNTA", in: NSRect(x: 90, y: 500, width: 900, height: 72), size: 50, weight: .bold, color: forest, alignment: .center, alpha: alpha, tracking: -0.8)
        drawText("AO SEU PROJETO.", in: NSRect(x: 90, y: 568, width: 900, height: 80), size: 58, weight: .heavy, color: green, alignment: .center, alpha: alpha, tracking: -1.1)

        fillRoundedRect(NSRect(x: 330, y: 706, width: 420, height: 92), radius: 46, color: amber, alpha: alpha)
        drawText("COMECE AGORA", in: NSRect(x: 330, y: 728, width: 420, height: 52), size: 31, weight: .heavy, color: deepForest, alignment: .center, alpha: alpha, tracking: 1.6)

        NSGraphicsContext.saveGraphicsState()
        let shadow = NSShadow()
        shadow.shadowColor = deepForest.withAlphaComponent(0.18 * alpha)
        shadow.shadowBlurRadius = 28
        shadow.shadowOffset = NSSize(width: 0, height: 14)
        shadow.set()
        fillRoundedRect(NSRect(x: 276, y: 872, width: 528, height: 528), radius: 38, color: NSColor.white, alpha: alpha)
        NSGraphicsContext.restoreGraphicsState()
        drawImageFit(qrCode, in: NSRect(x: 304, y: 900, width: 472, height: 472), alpha: alpha)

        drawText("ESCANEIE E COMECE", in: NSRect(x: 120, y: 1460, width: 840, height: 54), size: 29, weight: .bold, color: muted, alignment: .center, alpha: alpha, tracking: 2.3)
        drawText("mapadapesquisa.com.br", in: NSRect(x: 80, y: 1532, width: 920, height: 72), size: 43, weight: .bold, color: forest, alignment: .center, alpha: alpha, tracking: -0.5)

        let pulse = 0.82 + 0.18 * sin((time - 10.5) * 2.2)
        strokeRoundedRect(NSRect(x: 272, y: 868, width: 536, height: 536), radius: 42, color: green, width: 4, alpha: alpha * pulse)
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

private func chordSample(time: Double) -> Double {
    let segments: [(Double, Double, [Double])] = [
        (0.0, 3.2, [146.83, 220.00, 293.66]),
        (3.2, 6.8, [196.00, 293.66, 392.00]),
        (6.8, 10.5, [246.94, 369.99, 493.88]),
        (10.5, 15.0, [293.66, 440.00, 587.33]),
    ]
    var sample = 0.0
    for segment in segments where time >= segment.0 && time < segment.1 {
        let local = time - segment.0
        let remaining = segment.1 - time
        let envelope = min(1, min(local / 0.55, remaining / 0.75))
        for (index, frequency) in segment.2.enumerated() {
            let weight = [0.055, 0.040, 0.028][index]
            sample += sin(2 * .pi * frequency * time) * weight * envelope
            sample += sin(2 * .pi * frequency * 2 * time + 0.3) * weight * 0.13 * envelope
        }
    }

    let beatPhase = time.truncatingRemainder(dividingBy: 0.5)
    let pulse = sin(2 * .pi * 62 * beatPhase) * exp(-beatPhase * 12) * 0.07
    let sparkleTimes = [0.2, 3.2, 6.8, 10.5]
    var sparkle = 0.0
    for start in sparkleTimes where time >= start && time < start + 0.8 {
        let local = time - start
        sparkle += sin(2 * .pi * 880 * local) * exp(-local * 5.5) * 0.028
        sparkle += sin(2 * .pi * 1320 * local) * exp(-local * 6.5) * 0.014
    }
    let masterEnvelope = min(1, min(time / 0.7, (videoDuration - time) / 1.0))
    return (sample + pulse + sparkle) * max(0, masterEnvelope)
}

private func makeSoundtrack(output: URL) throws {
    let sampleRate: UInt32 = 44_100
    let channels: UInt16 = 2
    let bitsPerSample: UInt16 = 16
    let sampleCount = Int(Double(sampleRate) * videoDuration)
    let blockAlign = channels * bitsPerSample / 8
    let byteRate = sampleRate * UInt32(blockAlign)
    let dataSize = UInt32(sampleCount) * UInt32(blockAlign)

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
        let time = Double(index) / Double(sampleRate)
        let sample = max(-0.92, min(0.92, chordSample(time: time)))
        let left = Int16(sample * 0.98 * Double(Int16.max))
        let rightModulation = 0.97 + 0.03 * sin(2 * .pi * 0.21 * time)
        let right = Int16(sample * rightModulation * Double(Int16.max))
        wav.appendLittleEndian(left)
        wav.appendLittleEndian(right)
    }
    try wav.write(to: output, options: .atomic)
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
    exporter.shouldOptimizeForNetworkUse = true
    try await exporter.export(to: output, as: .mp4)
}

private func technicalReport(video: URL, qrPayload: String) async throws -> [String: Any] {
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
        "qrPayload": qrPayload,
        "videoCodec": "H.264",
        "width": Int(size.width.rounded()),
    ]
}

@main
private struct SocialPromoGenerator {
    static func main() async throws {
        let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true)
        let outputDirectory = root.appendingPathComponent("outputs/social-promo-c78", isDirectory: true)
        try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

        let scene = try loadImage(outputDirectory.appendingPathComponent("scene-student.png"))
        let wordmark = try loadImage(root.appendingPathComponent("public/brand/mapa-da-pesquisa-wordmark.png"))
        let mark = try loadImage(root.appendingPathComponent("public/brand/mapa-da-pesquisa-app-icon.png"))

        let qrCGImage = try makeQRCode(content: targetURL)
        try validateQRCode(qrCGImage, expected: targetURL)
        let qrURL = outputDirectory.appendingPathComponent("qr-mapadapesquisa.png")
        try savePNG(qrCGImage, to: qrURL)
        let qrImage = NSImage(cgImage: qrCGImage, size: NSSize(width: 520, height: 520))

        let renderer = PromoRenderer(scene: scene, wordmark: wordmark, mark: mark, qrCode: qrImage)
        _ = try renderStill(renderer: renderer, time: 1.55, output: outputDirectory.appendingPathComponent("cover.png"))
        _ = try renderStill(renderer: renderer, time: 6.8, output: outputDirectory.appendingPathComponent("frame-flow.png"))
        let finalFrame = try renderStill(renderer: renderer, time: 12.0, output: outputDirectory.appendingPathComponent("frame-final.png"))
        try validateQRCode(finalFrame, expected: targetURL)

        let silentVideo = outputDirectory.appendingPathComponent(".render-silent.mp4")
        let soundtrack = outputDirectory.appendingPathComponent("soundtrack-original.wav")
        let finalVideo = outputDirectory.appendingPathComponent("mapa-da-pesquisa-social-15s.mp4")
        try await makeSilentVideo(renderer: renderer, output: silentVideo)
        try makeSoundtrack(output: soundtrack)
        try await combine(video: silentVideo, audio: soundtrack, output: finalVideo)
        try? FileManager.default.removeItem(at: silentVideo)

        let report = try await technicalReport(video: finalVideo, qrPayload: targetURL)
        let reportData = try JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes])
        try reportData.write(to: outputDirectory.appendingPathComponent("technical-report.json"), options: .atomic)
        print(String(data: reportData, encoding: .utf8)!)
    }
}
